package com.edxkart.web;

import com.edxkart.dto.Dtos.*;
import com.edxkart.model.User;
import com.edxkart.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/orders")
public class OrderController {
    private final OrderService orders;
    public OrderController(OrderService orders) { this.orders = orders; }

    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public OrderDto place(@AuthenticationPrincipal User u, @Valid @RequestBody OrderReq req) { return orders.place(u, req); }
    @GetMapping public List<OrderDto> list(@AuthenticationPrincipal User u) { return orders.list(u); }
    @GetMapping("/{id}") public OrderDto get(@AuthenticationPrincipal User u, @PathVariable Long id) { return orders.get(u, id); }
    @PostMapping("/{id}/cancel") public OrderDto cancel(@AuthenticationPrincipal User u, @PathVariable Long id) { return orders.cancel(u, id); }
}
