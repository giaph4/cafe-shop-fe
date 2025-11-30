// Script để generate BCrypt hash cho password
import bcrypt from 'bcryptjs';

// Password cho users (KHÁC với JWT secret key)
// JWT secret key được cấu hình trong application.properties
const password = 'Password123!';

// Generate hash với 10 rounds (giống Spring Security)
bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }
    
    console.log('============================================');
    console.log('Password:', password);
    console.log('============================================');
    console.log('BCrypt Hash:');
    console.log(hash);
    console.log('============================================');
    console.log('\nCopy hash trên và paste vào file V9_sample_data.sql');
    console.log('Thay thế tất cả các hash cũ trong cột password của bảng users');
});

