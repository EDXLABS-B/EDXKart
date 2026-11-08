package com.edxkart.web;

import com.edxkart.config.*;
import com.edxkart.dto.Dtos.*;
import com.edxkart.model.User;
import com.edxkart.repo.UserRepo;
import com.edxkart.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api")
public class AuthController {
    private final UserRepo users; private final PasswordEncoder encoder; private final JwtService jwt; private final AccountService account;

    public AuthController(UserRepo users, PasswordEncoder encoder, JwtService jwt, AccountService account) {
        this.users = users; this.encoder = encoder; this.jwt = jwt; this.account = account;
    }

    @PostMapping("/auth/register") @ResponseStatus(HttpStatus.CREATED)
    public AuthRes register(@Valid @RequestBody RegisterReq req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists");
        User u = new User();
        u.setName(req.name().trim()); u.setEmail(email); u.setPhone(req.phone()); u.setPassword(encoder.encode(req.password()));
        u = users.save(u);
        return new AuthRes(jwt.create(u.getEmail()), UserDto.from(u));
    }

    @PostMapping("/auth/login")
    public AuthRes login(@Valid @RequestBody LoginReq req) {
        User u = users.findByEmail(req.email().trim().toLowerCase()).orElse(null);
        if (u == null || !encoder.matches(req.password(), u.getPassword()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        return new AuthRes(jwt.create(u.getEmail()), UserDto.from(u));
    }

    @GetMapping("/auth/me")
    public UserDto me(@AuthenticationPrincipal User u) {
        if (u == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "Please sign in to continue");
        return UserDto.from(u);
    }

    @PutMapping("/users/me")
    public UserDto update(@AuthenticationPrincipal User u, @Valid @RequestBody UpdateProfileReq req) { return account.updateProfile(u, req); }
}
