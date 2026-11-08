package com.edxkart.web;

import com.edxkart.dto.Dtos.*;
import com.edxkart.model.User;
import com.edxkart.service.CatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api")
public class CatalogController {
    private final CatalogService catalog;
    public CatalogController(CatalogService catalog) { this.catalog = catalog; }

    @GetMapping("/products")
    public PageRes<ProductDto> products(@RequestParam(required = false) String q, @RequestParam(required = false) String category,
                                        @RequestParam(required = false) List<String> brand, @RequestParam(required = false) Long minPrice,
                                        @RequestParam(required = false) Long maxPrice, @RequestParam(defaultValue = "false") boolean deals,
                                        @RequestParam(defaultValue = "false") boolean flash, @RequestParam(defaultValue = "pop") String sort,
                                        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "24") int size) {
        return catalog.search(q, category, brand, minPrice, maxPrice, deals, flash, sort, page, size);
    }

    @GetMapping("/products/{id}") public ProductDto product(@PathVariable Long id) { return catalog.get(id); }
    @GetMapping("/products/{id}/related") public List<ProductDto> related(@PathVariable Long id) { return catalog.related(id, 4); }
    @GetMapping("/products/{id}/reviews") public List<ReviewDto> reviews(@PathVariable Long id) { return catalog.reviews(id); }

    @PostMapping("/products/{id}/reviews") @ResponseStatus(HttpStatus.CREATED)
    public ReviewDto addReview(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody ReviewReq req) {
        return catalog.addReview(u, id, req);
    }

    @GetMapping("/categories") public List<String> categories() { return catalog.categories(); }
    @GetMapping("/brands") public List<String> brands() { return catalog.brands(); }
}
