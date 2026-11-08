package com.edxkart.repo;

import com.edxkart.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepo extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserIdOrderByIdDesc(Long userId);
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);
    long countByUserId(Long userId);
}
