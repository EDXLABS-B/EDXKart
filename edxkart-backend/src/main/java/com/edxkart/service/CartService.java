package com.edxkart.service;

import com.edxkart.config.ApiException;
import com.edxkart.dto.Dtos.*;
import com.edxkart.model.*;
import com.edxkart.repo.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CartService {
    private final CartRepo carts; private final ProductRepo products; private final UserRepo users; private final WishlistRepo wishlist;

    public CartService(CartRepo carts, ProductRepo products, UserRepo users, WishlistRepo wishlist) {
        this.carts = carts; this.products = products; this.users = users; this.wishlist = wishlist;
    }

    @Transactional(readOnly = true)
    public CartDto get(User u) {
        List<CartItemDto> items = carts.findByUserIdOrderByIdAsc(u.getId()).stream().map(CartItemDto::from).toList();
        long sub = items.stream().mapToLong(i -> i.mrp() * i.quantity()).sum();
        long tot = items.stream().mapToLong(i -> i.price() * i.quantity()).sum();
        return new CartDto(items, items.stream().mapToInt(CartItemDto::quantity).sum(), sub, sub - tot, tot);
    }

    @Transactional
    public CartDto add(User u, CartItemReq req) {
        Product p = products.findById(req.productId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        String opt = req.option() == null ? "" : req.option();
        CartItem item = carts.findByUserIdAndProductIdAndOptionLabel(u.getId(), p.getId(), opt).orElseGet(() -> {
            CartItem c = new CartItem();
            c.setUser(users.getReferenceById(u.getId())); c.setProduct(p); c.setOptionLabel(opt);
            return c;
        });
        int qty = item.getQuantity() + req.quantity();
        if (qty > p.getStock()) throw new ApiException(HttpStatus.CONFLICT, "Only " + p.getStock() + " in stock for " + p.getName());
        item.setQuantity(qty);
        carts.save(item);
        return get(u);
    }

    @Transactional
    public CartDto setQty(User u, Long itemId, int qty) {
        CartItem c = owned(u, itemId);
        if (qty > c.getProduct().getStock()) throw new ApiException(HttpStatus.CONFLICT, "Only " + c.getProduct().getStock() + " in stock");
        c.setQuantity(qty);
        return get(u);
    }

    @Transactional
    public CartDto remove(User u, Long itemId) { carts.delete(owned(u, itemId)); return get(u); }

    @Transactional
    public void clear(User u) { carts.deleteByUserId(u.getId()); }

    private CartItem owned(User u, Long id) {
        CartItem c = carts.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Cart item not found"));
        if (!c.getUser().getId().equals(u.getId())) throw new ApiException(HttpStatus.NOT_FOUND, "Cart item not found");
        return c;
    }

    // ---- wishlist ----
    @Transactional(readOnly = true)
    public List<ProductDto> wishlist(User u) {
        return wishlist.findByUserIdOrderByIdDesc(u.getId()).stream().map(w -> ProductDto.from(w.getProduct())).toList();
    }

    @Transactional
    public boolean toggleWishlist(User u, Long productId) {
        var existing = wishlist.findByUserIdAndProductId(u.getId(), productId);
        if (existing.isPresent()) { wishlist.delete(existing.get()); return false; }
        Product p = products.findById(productId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        WishlistItem w = new WishlistItem();
        w.setUser(users.getReferenceById(u.getId())); w.setProduct(p);
        wishlist.save(w);
        return true;
    }
}
