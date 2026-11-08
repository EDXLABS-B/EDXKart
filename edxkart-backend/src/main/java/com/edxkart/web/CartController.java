package com.edxkart.web;

import com.edxkart.dto.Dtos.*;
import com.edxkart.model.User;
import com.edxkart.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController @RequestMapping("/api")
public class CartController {
    private final CartService cart;
    public CartController(CartService cart) { this.cart = cart; }

    @GetMapping("/cart") public CartDto get(@AuthenticationPrincipal User u) { return cart.get(u); }
    @PostMapping("/cart/items") public CartDto add(@AuthenticationPrincipal User u, @Valid @RequestBody CartItemReq r) { return cart.add(u, r); }
    @PutMapping("/cart/items/{id}") public CartDto qty(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody QtyReq r) { return cart.setQty(u, id, r.quantity()); }
    @DeleteMapping("/cart/items/{id}") public CartDto remove(@AuthenticationPrincipal User u, @PathVariable Long id) { return cart.remove(u, id); }
    @DeleteMapping("/cart") @ResponseStatus(HttpStatus.NO_CONTENT) public void clear(@AuthenticationPrincipal User u) { cart.clear(u); }

    @GetMapping("/wishlist") public List<ProductDto> wishlist(@AuthenticationPrincipal User u) { return cart.wishlist(u); }
    @PostMapping("/wishlist/{productId}/toggle")
    public Map<String, Boolean> toggle(@AuthenticationPrincipal User u, @PathVariable Long productId) {
        return Map.of("wishlisted", cart.toggleWishlist(u, productId));
    }
}
