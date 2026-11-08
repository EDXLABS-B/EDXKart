package com.edxkart.repo;

import com.edxkart.model.CartItem;
import org.springframework.data.jpa.repository.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface CartRepo extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserIdOrderByIdAsc(Long userId);
    Optional<CartItem> findByUserIdAndProductIdAndOptionLabel(Long userId, Long productId, String optionLabel);
    @Transactional @Modifying @Query("delete from CartItem c where c.user.id = :userId")
    void deleteByUserId(Long userId);
}
