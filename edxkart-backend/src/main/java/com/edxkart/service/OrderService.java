package com.edxkart.service;

import com.edxkart.config.ApiException;
import com.edxkart.dto.Dtos.*;
import com.edxkart.model.*;
import com.edxkart.repo.*;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

@Service
public class OrderService {
    private static final Set<String> PAYMENTS = Set.of("UPI", "Card", "NetBanking", "COD");
    private final OrderRepo orders; private final ProductRepo products; private final CartRepo carts; private final UserRepo users;

    public OrderService(OrderRepo orders, ProductRepo products, CartRepo carts, UserRepo users) {
        this.orders = orders; this.products = products; this.carts = carts; this.users = users;
    }

    /** Places an order from the request items, or from the server-side cart when none are sent. Prices always come from the database. */
    @Transactional
    public OrderDto place(User u, OrderReq req) {
        if (!PAYMENTS.contains(req.paymentMethod())) throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported payment method");
        List<OrderItemReq> src = req.items() != null && !req.items().isEmpty() ? req.items()
                : carts.findByUserIdOrderByIdAsc(u.getId()).stream()
                        .map(c -> new OrderItemReq(c.getProduct().getId(), c.getQuantity(), c.getOptionLabel())).toList();
        if (src.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Your cart is empty");

        AddressReq a = req.address();
        Order o = new Order();
        o.setUser(users.getReferenceById(u.getId()));
        o.setPaymentMethod(req.paymentMethod());
        o.setShipName(a.fullName()); o.setShipPhone(a.phone()); o.setShipLine(a.line());
        o.setShipCity(a.city()); o.setShipState(a.state()); o.setShipPin(a.pin());

        long sub = 0, tot = 0;
        for (OrderItemReq it : src) {
            Product p = products.lockById(it.productId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found: " + it.productId()));
            if (p.getStock() < it.quantity())
                throw new ApiException(HttpStatus.CONFLICT, "Only " + p.getStock() + " left of " + p.getName());
            p.setStock(p.getStock() - it.quantity());
            OrderItem oi = new OrderItem();
            oi.setOrder(o); oi.setProductId(p.getId()); oi.setName(p.getName()); oi.setIcon(p.getIcon());
            oi.setOptionLabel(it.option() == null ? "" : it.option());
            oi.setPrice(p.getPrice()); oi.setMrp(p.getMrp()); oi.setQuantity(it.quantity());
            o.getItems().add(oi);
            sub += p.getMrp() * it.quantity();
            tot += p.getPrice() * it.quantity();
        }
        o.setSubtotal(sub); o.setTotal(tot); o.setDiscount(sub - tot);
        orders.save(o);
        o.setOrderNo("EDX" + (100000 + o.getId()));
        carts.deleteByUserId(u.getId());
        return OrderDto.from(o);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> list(User u) {
        return orders.findByUserIdOrderByCreatedAtDesc(u.getId()).stream().map(OrderDto::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderDto get(User u, Long id) { return OrderDto.from(owned(u, id)); }

    @Transactional
    public OrderDto cancel(User u, Long id) {
        Order o = owned(u, id);
        if (o.getStatus() != Order.Status.PLACED) throw new ApiException(HttpStatus.CONFLICT, "Only orders that are not yet shipped can be cancelled");
        o.setStatus(Order.Status.CANCELLED);
        for (OrderItem i : o.getItems()) products.lockById(i.getProductId()).ifPresent(p -> p.setStock(p.getStock() + i.getQuantity()));
        return OrderDto.from(o);
    }

    private Order owned(User u, Long id) {
        Order o = orders.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!o.getUser().getId().equals(u.getId())) throw new ApiException(HttpStatus.NOT_FOUND, "Order not found");
        return o;
    }

    /** Simulates fulfilment so order status moves on its own: placed -> shipped after 2 min -> delivered after 5 min. */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void advanceOrders() {
        Instant now = Instant.now();
        orders.findByStatusAndCreatedAtBefore(Order.Status.SHIPPED, now.minus(5, ChronoUnit.MINUTES)).forEach(o -> o.setStatus(Order.Status.DELIVERED));
        orders.findByStatusAndCreatedAtBefore(Order.Status.PLACED, now.minus(2, ChronoUnit.MINUTES)).forEach(o -> o.setStatus(Order.Status.SHIPPED));
    }
}
