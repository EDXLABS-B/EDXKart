package com.edxkart.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "addresses") @Getter @Setter @NoArgsConstructor
public class Address {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private User user;
    private String fullName, phone, line, city, state, pin;
    private boolean defaultAddress;
}
