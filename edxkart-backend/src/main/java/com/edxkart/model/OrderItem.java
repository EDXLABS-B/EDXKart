package com.edxkart.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "order_items") @Getter @Setter @NoArgsConstructor
public class OrderItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id") private Order order;
    private Long productId;
    private String name, icon, optionLabel;
    private long price, mrp;
    private int quantity;
}
