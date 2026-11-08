package com.edxkart.web;

import com.edxkart.dto.Dtos.*;
import com.edxkart.model.User;
import com.edxkart.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api")
public class AccountController {
    private final AccountService account;
    public AccountController(AccountService account) { this.account = account; }

    @GetMapping("/dashboard") public DashboardDto dashboard(@AuthenticationPrincipal User u) { return account.dashboard(u); }
    @GetMapping("/addresses") public List<AddressDto> list(@AuthenticationPrincipal User u) { return account.addresses(u); }
    @PostMapping("/addresses") @ResponseStatus(HttpStatus.CREATED)
    public AddressDto create(@AuthenticationPrincipal User u, @Valid @RequestBody AddressReq r) { return account.saveAddress(u, null, r); }
    @PutMapping("/addresses/{id}")
    public AddressDto update(@AuthenticationPrincipal User u, @PathVariable Long id, @Valid @RequestBody AddressReq r) { return account.saveAddress(u, id, r); }
    @DeleteMapping("/addresses/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User u, @PathVariable Long id) { account.deleteAddress(u, id); }
}
