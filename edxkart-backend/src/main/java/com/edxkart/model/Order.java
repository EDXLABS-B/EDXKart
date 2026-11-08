package com.edxkart.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity(name = "PurchaseOrder") @Table(name = "orders") @Getter @Setter @NoArgsConstructor
public class Order {
    public enum Status { PLACED, SHIPPED, DELIVERED, CANCELLED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(unique = true) private String orderNo;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @Enumerated(EnumType.STRING) private Status status = Status.PLACED;
    private String paymentMethod;
    private long subtotal, discount, total;
    private String shipName, shipPhone, shipLine, shipCity, shipState, shipPin;
    private Instant createdAt = Instant.now();
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) private List<OrderItem> items = new ArrayList<>();
}
