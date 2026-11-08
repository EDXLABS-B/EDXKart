package com.edxkart.service;

import com.edxkart.config.ApiException;
import com.edxkart.dto.Dtos.*;
import com.edxkart.model.*;
import com.edxkart.repo.*;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
public class CatalogService {
    private final ProductRepo products; private final ReviewRepo reviews; private final UserRepo users;

    public CatalogService(ProductRepo products, ReviewRepo reviews, UserRepo users) {
        this.products = products; this.reviews = reviews; this.users = users;
    }

    @Transactional(readOnly = true)
    public PageRes<ProductDto> search(String q, String category, List<String> brands, Long minPrice, Long maxPrice,
                                      boolean deals, boolean flash, String sort, int page, int size) {
        Specification<Product> spec = (r, cq, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                p.add(cb.or(cb.like(cb.lower(r.get("name")), like), cb.like(cb.lower(r.get("brand")), like), cb.like(cb.lower(r.get("category")), like)));
            }
            if (category != null && !category.isBlank()) p.add(cb.equal(r.get("category"), category));
            if (brands != null && !brands.isEmpty()) p.add(r.get("brand").in(brands));
            if (minPrice != null) p.add(cb.ge(r.<Long>get("price"), minPrice));
            if (maxPrice != null) p.add(cb.lt(r.<Long>get("price"), maxPrice));
            if (deals) p.add(cb.le(cb.prod(r.<Long>get("price"), 100L), cb.prod(r.<Long>get("mrp"), 60L)));
            if (flash) p.add(cb.isTrue(r.get("flash")));
            return cb.and(p.toArray(new Predicate[0]));
        };
        Sort s = switch (sort == null ? "pop" : sort) {
            case "price" -> Sort.by("price").ascending();
            case "priceD" -> Sort.by("price").descending();
            case "rate" -> Sort.by("rating").descending();
            default -> Sort.by("reviewCount").descending();
        };
        Page<Product> res = products.findAll(spec, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), s.and(Sort.by("id"))));
        return new PageRes<>(res.getContent().stream().map(ProductDto::from).toList(), res.getTotalElements(), res.getNumber(), res.getSize());
    }

    @Transactional(readOnly = true)
    public ProductDto get(Long id) {
        return ProductDto.from(products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found")));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> related(Long id, int limit) {
        Product p = products.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        Specification<Product> spec = (r, cq, cb) -> cb.and(cb.equal(r.get("category"), p.getCategory()), cb.notEqual(r.get("id"), id));
        return products.findAll(spec, PageRequest.of(0, limit, Sort.by("reviewCount").descending())).stream().map(ProductDto::from).toList();
    }

    public List<String> categories() { return products.categories(); }
    public List<String> brands() { return products.brands(); }

    @Transactional(readOnly = true)
    public List<ReviewDto> reviews(Long productId) {
        return reviews.findByProductIdOrderByCreatedAtDesc(productId).stream().map(ReviewDto::from).toList();
    }

    @Transactional
    public ReviewDto addReview(User u, Long productId, ReviewReq req) {
        Product p = products.findById(productId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        Review r = new Review();
        r.setProduct(p); r.setUser(users.getReferenceById(u.getId())); r.setRating(req.rating()); r.setBody(req.body().trim());
        r = reviews.save(r);
        int n = p.getReviewCount();
        p.setRating(Math.round(((p.getRating() * n + req.rating()) / (n + 1)) * 10) / 10.0);
        p.setReviewCount(n + 1);
        r.setUser(users.findById(u.getId()).orElseThrow());
        return ReviewDto.from(r);
    }
}
