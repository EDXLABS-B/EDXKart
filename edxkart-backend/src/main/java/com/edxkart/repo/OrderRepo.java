package com.edxkart.repo;

import com.edxkart.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;

public interface OrderRepo extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
    List<Order> findByStatusAndCreatedAtBefore(Order.Status status, Instant before);
}
