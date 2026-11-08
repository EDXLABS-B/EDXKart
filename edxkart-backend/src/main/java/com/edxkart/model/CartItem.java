package com.edxkart.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "cart_items", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id", "option_label"}))
@Getter @Setter @NoArgsConstructor
public class CartItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    @ManyToOne(fetch = FetchType.EAGER, optional = false) @JoinColumn(name = "product_id") private Product product;
    private int quantity;
    @Column(name = "option_label", nullable = false) private String optionLabel = "";
}
