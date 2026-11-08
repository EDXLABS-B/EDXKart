package com.edxkart.config;

import com.edxkart.model.*;
import com.edxkart.repo.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.List;

/** Seeds the catalogue and a demo account on first start (only when the tables are empty). */
@Component
public class DataSeeder implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private final ProductRepo products; private final UserRepo users; private final PasswordEncoder encoder;
    private final boolean enabled;

    public DataSeeder(ProductRepo products, UserRepo users, PasswordEncoder encoder, @Value("${app.seed:true}") boolean enabled) {
        this.products = products; this.users = users; this.encoder = encoder; this.enabled = enabled;
    }

    private Product p(String name, String cat, String brand, long price, long mrp, double rating, int reviews, String icon, boolean flash, String desc) {
        Product x = new Product();
        x.setName(name); x.setCategory(cat); x.setBrand(brand); x.setPrice(price); x.setMrp(mrp); x.setRating(rating);
        x.setReviewCount(reviews); x.setIcon(icon); x.setFlash(flash); x.setStock(50); x.setDescription(desc);
        return x;
    }

    @Override
    public void run(String... args) {
        if (!enabled) return;
        if (products.count() == 0) {
            products.saveAll(List.of(
                p("Apple iPhone 15 (128GB)", "Mobiles", "Apple", 69999, 79900, 4.7, 2300, "📱", false, "6.1-inch Super Retina XDR display, A16 Bionic chip, dual-camera system (48MP main + 12MP ultra wide), up to 20 hours video playback."),
                p("Samsung Galaxy S24", "Mobiles", "Samsung", 59999, 74999, 4.6, 1800, "📱", false, "Galaxy AI features, bright 6.2-inch Dynamic AMOLED display and a 50MP triple camera."),
                p("Dell Inspiron 15 Laptop", "Laptops", "Dell", 52990, 64990, 4.3, 1200, "💻", false, "15.6-inch FHD display, 12th Gen Intel Core i5, 16GB RAM and 512GB SSD."),
                p("Lenovo IdeaPad Slim 3", "Laptops", "Lenovo", 34990, 50990, 4.5, 820, "💻", false, "Thin and light everyday laptop with a Ryzen 5 processor, 8GB RAM and 512GB SSD."),
                p("Sony WH-1000XM5", "Electronics", "Sony", 24990, 34990, 4.7, 560, "🎧", false, "Industry-leading noise cancellation with 30-hour battery life."),
                p("boAt Rockerz 550", "Electronics", "boAt", 2499, 4999, 4.3, 3400, "🎧", false, "Over-ear Bluetooth headphones with 20-hour playback and plush ear cushions."),
                p("Samsung Galaxy Watch6", "Electronics", "Samsung", 24990, 30999, 4.4, 210, "⌚", false, "Sleep coaching, body composition and heart-rate tracking on a sapphire-crystal display."),
                p("Nike Running Shoes", "Sports", "Nike", 2999, 6495, 4.4, 987, "👟", false, "Lightweight, breathable running shoes with responsive cushioning."),
                p("Puma Cotton T-shirt", "Fashion", "Puma", 799, 1499, 4.2, 756, "👕", false, "Soft regular-fit cotton T-shirt for everyday wear."),
                p("boAt Airdopes 141", "Electronics", "boAt", 1999, 4490, 4.3, 4200, "🎧", true, "True wireless earbuds with 42 hours of total playback and low-latency mode."),
                p("Noise Buds VS104", "Electronics", "Noise", 1299, 2999, 4.1, 2100, "🎧", true, "Wireless earbuds with environmental noise cancellation on calls."),
                p("Wildcraft 45L Backpack", "Sports", "Wildcraft", 1999, 3499, 4.2, 1200, "🎒", true, "Water-resistant 45L backpack with padded shoulder straps and a laptop sleeve."),
                p("SanDisk Ultra 128GB", "Electronics", "SanDisk", 799, 1499, 4.4, 5600, "💾", true, "Class 10 microSD card with read speeds up to 140MB/s."),
                p("Philips Trimmer", "Beauty", "Philips", 1199, 1895, 4.3, 3100, "🪒", true, "Cordless trimmer with 60 minutes of runtime and adjustable length settings."),
                p("Mi Smart Band 8", "Electronics", "Xiaomi", 2499, 3999, 4.2, 1500, "⌚", false, "1.62-inch AMOLED display, 16-day battery life and 150+ workout modes."),
                p("Minimal 3-Seater Sofa", "Home & Living", "Urban", 18999, 29999, 4.0, 95, "🛋️", false, "Fabric 3-seater sofa with solid-wood frame and high-density foam cushions.")));
            log.info("Seeded {} products", products.count());
        }
        if (!users.existsByEmail("demo@edxkart.com")) {
            User u = new User();
            u.setName("Aditya Pandey"); u.setEmail("demo@edxkart.com"); u.setPhone("9876543210"); u.setPassword(encoder.encode("Demo@123"));
            users.save(u);
            log.info("Demo user ready: demo@edxkart.com / Demo@123");
        }
    }
}
