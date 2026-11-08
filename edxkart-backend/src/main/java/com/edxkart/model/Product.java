package com.edxkart.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "products") @Getter @Setter @NoArgsConstructor
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private String name;
    private String category, brand, icon;
    private long price, mrp;
    private double rating;
    private int reviewCount;
    private boolean flash;
    private int stock;
    @Column(length = 1000) private String description;
}
