package com.edxkart.service;

import com.edxkart.config.ApiException;
import com.edxkart.dto.Dtos.*;
import com.edxkart.model.*;
import com.edxkart.repo.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AccountService {
    private final UserRepo users; private final AddressRepo addresses; private final OrderRepo orders; private final WishlistRepo wishlist;

    public AccountService(UserRepo users, AddressRepo addresses, OrderRepo orders, WishlistRepo wishlist) {
        this.users = users; this.addresses = addresses; this.orders = orders; this.wishlist = wishlist;
    }

    @Transactional
    public UserDto updateProfile(User u, UpdateProfileReq req) {
        User db = users.findById(u.getId()).orElseThrow();
        db.setName(req.name().trim()); db.setPhone(req.phone());
        return UserDto.from(db);
    }

    @Transactional(readOnly = true)
    public List<AddressDto> addresses(User u) {
        return addresses.findByUserIdOrderByIdAsc(u.getId()).stream().map(AddressDto::from).toList();
    }

    @Transactional
    public AddressDto saveAddress(User u, Long id, AddressReq req) {
        Address a;
        if (id == null) { a = new Address(); a.setUser(users.getReferenceById(u.getId())); }
        else a = ownedAddress(u, id);
        a.setFullName(req.fullName()); a.setPhone(req.phone()); a.setLine(req.line());
        a.setCity(req.city()); a.setState(req.state()); a.setPin(req.pin());
        boolean first = id == null && addresses.countByUserId(u.getId()) == 0;
        a.setDefaultAddress(req.defaultAddress() || first);
        if (a.isDefaultAddress())
            addresses.findByUserIdOrderByIdAsc(u.getId()).stream().filter(o -> !o.getId().equals(a.getId())).forEach(o -> o.setDefaultAddress(false));
        return AddressDto.from(addresses.save(a));
    }

    @Transactional
    public void deleteAddress(User u, Long id) { addresses.delete(ownedAddress(u, id)); }

    private Address ownedAddress(User u, Long id) {
        Address a = addresses.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Address not found"));
        if (!a.getUser().getId().equals(u.getId())) throw new ApiException(HttpStatus.NOT_FOUND, "Address not found");
        return a;
    }

    @Transactional(readOnly = true)
    public DashboardDto dashboard(User u) {
        User db = users.findById(u.getId()).orElseThrow();
        List<OrderDto> recent = orders.findByUserIdOrderByCreatedAtDesc(u.getId()).stream().limit(3).map(OrderDto::from).toList();
        List<ProductDto> wish = wishlist.findByUserIdOrderByIdDesc(u.getId()).stream().limit(8).map(w -> ProductDto.from(w.getProduct())).toList();
        return new DashboardDto(db.getName(), orders.countByUserId(u.getId()), wishlist.countByUserId(u.getId()),
                addresses.countByUserId(u.getId()), recent, wish);
    }
}
