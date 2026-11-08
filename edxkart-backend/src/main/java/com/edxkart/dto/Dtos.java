package com.edxkart.dto;

import com.edxkart.model.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---- auth ----
    public record RegisterReq(@NotBlank String name, @NotBlank @Email String email,
                              @NotBlank @Size(min = 6, message = "must be at least 6 characters") String password, String phone) {}
    public record LoginReq(@NotBlank @Email String email, @NotBlank String password) {}
    public record UpdateProfileReq(@NotBlank String name, String phone) {}
    public record UserDto(Long id, String name, String email, String phone) {
        public static UserDto from(User u) { return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone()); }
    }
    public record AuthRes(String token, UserDto user) {}

    // ---- catalog ----
    public record ProductDto(Long id, String name, String category, String brand, long price, long mrp, int off,
                             double rating, int reviews, String icon, boolean flash, int stock, String description) {
        public static ProductDto from(Product p) {
            int off = p.getMrp() > 0 ? (int) Math.round((1 - (double) p.getPrice() / p.getMrp()) * 100) : 0;
            return new ProductDto(p.getId(), p.getName(), p.getCategory(), p.getBrand(), p.getPrice(), p.getMrp(), off,
                    p.getRating(), p.getReviewCount(), p.getIcon(), p.isFlash(), p.getStock(), p.getDescription());
        }
    }
    public record PageRes<T>(List<T> items, long total, int page, int size) {}
    public record ReviewReq(@Min(1) @Max(5) int rating, @NotBlank @Size(max = 1000) String body) {}
    public record ReviewDto(Long id, String author, int rating, String body, Instant createdAt) {
        public static ReviewDto from(Review r) { return new ReviewDto(r.getId(), r.getUser().getName(), r.getRating(), r.getBody(), r.getCreatedAt()); }
    }

    // ---- cart ----
    public record CartItemReq(@NotNull Long productId, @Min(1) int quantity, String option) {}
    public record QtyReq(@Min(1) int quantity) {}
    public record CartItemDto(Long id, Long productId, String name, String icon, long price, long mrp, int quantity, String option) {
        public static CartItemDto from(CartItem c) {
            Product p = c.getProduct();
            return new CartItemDto(c.getId(), p.getId(), p.getName(), p.getIcon(), p.getPrice(), p.getMrp(), c.getQuantity(), c.getOptionLabel());
        }
    }
    public record CartDto(List<CartItemDto> items, int count, long subtotal, long discount, long total) {}

    // ---- addresses ----
    public record AddressReq(@NotBlank String fullName,
                             @NotBlank @Pattern(regexp = "^[6-9]\\d{9}$", message = "must be a valid 10-digit mobile number") String phone,
                             @NotBlank String line, @NotBlank String city, String state,
                             @NotBlank @Pattern(regexp = "^\\d{6}$", message = "must be a 6-digit PIN code") String pin,
                             boolean defaultAddress) {}
    public record AddressDto(Long id, String fullName, String phone, String line, String city, String state, String pin, boolean defaultAddress) {
        public static AddressDto from(Address a) {
            return new AddressDto(a.getId(), a.getFullName(), a.getPhone(), a.getLine(), a.getCity(), a.getState(), a.getPin(), a.isDefaultAddress());
        }
    }

    // ---- orders ----
    public record OrderItemReq(@NotNull Long productId, @Min(1) int quantity, String option) {}
    public record OrderReq(@NotNull @Valid AddressReq address, @NotBlank String paymentMethod, @Valid List<OrderItemReq> items) {}
    public record OrderItemDto(Long productId, String name, String icon, String option, long price, long mrp, int quantity) {}
    public record OrderDto(Long id, String orderNo, String status, String paymentMethod, long subtotal, long discount, long total,
                           Instant createdAt, String shipName, String shipPhone, String shipAddress, List<OrderItemDto> items) {
        public static OrderDto from(Order o) {
            String s = o.getStatus().name();
            String status = s.charAt(0) + s.substring(1).toLowerCase();
            String addr = String.join(", ", o.getShipLine(), o.getShipCity(), o.getShipPin());
            return new OrderDto(o.getId(), o.getOrderNo(), status, o.getPaymentMethod(), o.getSubtotal(), o.getDiscount(), o.getTotal(),
                    o.getCreatedAt(), o.getShipName(), o.getShipPhone(), addr,
                    o.getItems().stream().map(i -> new OrderItemDto(i.getProductId(), i.getName(), i.getIcon(), i.getOptionLabel(), i.getPrice(), i.getMrp(), i.getQuantity())).toList());
        }
    }

    // ---- dashboard ----
    public record DashboardDto(String name, long totalOrders, long wishlistCount, long addressCount,
                               List<OrderDto> recentOrders, List<ProductDto> wishlist) {}
}
