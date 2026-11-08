package com.edxkart.repo;

import com.edxkart.model.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AddressRepo extends JpaRepository<Address, Long> {
    List<Address> findByUserIdOrderByIdAsc(Long userId);
    long countByUserId(Long userId);
}
