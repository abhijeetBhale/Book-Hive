import mongoose from 'mongoose';
import User from '../models/User.js';
import Book from '../models/Book.js';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Indian Names Database
const indianNames = {
    male: [
        'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
        'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Vivek', 'Ansh', 'Harsh', 'Karan', 'Dhruv', 'Aryan',
        'Rohan', 'Rahul', 'Amit', 'Suresh', 'Rajesh', 'Vikram', 'Ashish', 'Deepak', 'Manoj', 'Sandeep'
    ],
    female: [
        'Saanvi', 'Aadya', 'Kiara', 'Diya', 'Pihu', 'Prisha', 'Ananya', 'Fatima', 'Anika', 'Myra',
        'Sara', 'Pari', 'Kavya', 'Aadhya', 'Arya', 'Ira', 'Riya', 'Navya', 'Zara', 'Avni',
        'Priya', 'Sneha', 'Pooja', 'Meera', 'Sita', 'Radha', 'Anjali', 'Sunita', 'Kavita', 'Nisha'
    ],
    surnames: [
        'Sharma', 'Verma', 'Gupta', 'Singh', 'Kumar', 'Agarwal', 'Jain', 'Bansal', 'Agrawal', 'Goyal',
        'Mittal', 'Joshi', 'Tiwari', 'Mishra', 'Pandey', 'Yadav', 'Reddy', 'Nair', 'Iyer', 'Menon',
        'Patel', 'Shah', 'Mehta', 'Desai', 'Modi', 'Thakur', 'Chauhan', 'Rajput', 'Sinha', 'Chopra',
        'Malhotra', 'Kapoor', 'Khanna', 'Bhatia', 'Sethi', 'Arora', 'Khurana', 'Tandon', 'Saxena', 'Goel'
    ]
};

// Major Indian Cities with Coordinates
const indianCities = [
    { name: 'Mumbai', state: 'Maharashtra', coordinates: [72.8777, 19.0760], addresses: ['Bandra West', 'Andheri East', 'Powai', 'Juhu', 'Colaba'] },
    { name: 'Delhi', state: 'Delhi', coordinates: [77.1025, 28.7041], addresses: ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Dwarka', 'Rohini'] },
    { name: 'Bangalore', state: 'Karnataka', coordinates: [77.5946, 12.9716], addresses: ['Koramangala', 'Indiranagar', 'Whitefield', 'Jayanagar', 'HSR Layout'] },
    { name: 'Hyderabad', state: 'Telangana', coordinates: [78.4867, 17.3850], addresses: ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Hitech City', 'Secunderabad'] },
    { name: 'Chennai', state: 'Tamil Nadu', coordinates: [80.2707, 13.0827], addresses: ['T. Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'OMR'] },
    { name: 'Kolkata', state: 'West Bengal', coordinates: [88.3639, 22.5726], addresses: ['Park Street', 'Salt Lake', 'Ballygunge', 'Howrah', 'New Town'] },
    { name: 'Pune', state: 'Maharashtra', coordinates: [73.8567, 18.5204], addresses: ['Koregaon Park', 'Baner', 'Wakad', 'Kothrud', 'Viman Nagar'] },
    { name: 'Ahmedabad', state: 'Gujarat', coordinates: [72.5714, 23.0225], addresses: ['Satellite', 'Vastrapur', 'Bopal', 'Maninagar', 'Navrangpura'] },
    { name: 'Jaipur', state: 'Rajasthan', coordinates: [75.7873, 26.9124], addresses: ['C-Scheme', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Tonk Road'] },
    { name: 'Surat', state: 'Gujarat', coordinates: [72.8311, 21.1702], addresses: ['Adajan', 'Vesu', 'Citylight', 'Rander', 'Athwa'] },
    { name: 'Lucknow', state: 'Uttar Pradesh', coordinates: [80.9462, 26.8467], addresses: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar'] },
    { name: 'Kanpur', state: 'Uttar Pradesh', coordinates: [80.3319, 26.4499], addresses: ['Civil Lines', 'Swaroop Nagar', 'Kakadeo', 'Govind Nagar', 'Kalyanpur'] },
    { name: 'Nagpur', state: 'Maharashtra', coordinates: [79.0882, 21.1458], addresses: ['Dharampeth', 'Sadar', 'Sitabuldi', 'Wardha Road', 'Hingna'] },
    { name: 'Indore', state: 'Madhya Pradesh', coordinates: [75.8577, 22.7196], addresses: ['Vijay Nagar', 'Palasia', 'Bhawar Kuan', 'Rau', 'Sukhliya'] },
    { name: 'Thane', state: 'Maharashtra', coordinates: [72.9781, 19.2183], addresses: ['Ghodbunder Road', 'Kasarvadavali', 'Majiwada', 'Naupada', 'Vartak Nagar'] },
    { name: 'Bhopal', state: 'Madhya Pradesh', coordinates: [77.4126, 23.2599], addresses: ['New Market', 'Arera Colony', 'MP Nagar', 'Kolar', 'Shahpura'] },
    { name: 'Visakhapatnam', state: 'Andhra Pradesh', coordinates: [83.2185, 17.6868], addresses: ['MVP Colony', 'Dwaraka Nagar', 'Gajuwaka', 'Madhurawada', 'Rushikonda'] },
    { name: 'Pimpri-Chinchwad', state: 'Maharashtra', coordinates: [73.7898, 18.6298], addresses: ['Pimpri', 'Chinchwad', 'Akurdi', 'Nigdi', 'Bhosari'] },
    { name: 'Patna', state: 'Bihar', coordinates: [85.1376, 25.5941], addresses: ['Boring Road', 'Kankarbagh', 'Rajendra Nagar', 'Patliputra', 'Bailey Road'] },
    { name: 'Vadodara', state: 'Gujarat', coordinates: [73.2081, 22.3072], addresses: ['Alkapuri', 'Fatehgunj', 'Sayajigunj', 'Manjalpur', 'Gotri'] }
];

// Popular Books Database
const popularBooks = [
    // Indian Authors
    { title: 'The God of Small Things', author: 'Arundhati Roy', category: 'Fiction', genre: ['Literary Fiction'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1309203843i/9777.jpg' },
    { title: 'Midnight\'s Children', author: 'Salman Rushdie', category: 'Fiction', genre: ['Historical Fiction'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1385738769i/14836.jpg' },
    { title: 'The Mahabharata: A Modern Rendering', author: 'Ramesh Menon', category: 'Mythology', genre: ['Mythology', 'Religion'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552449i/307797.jpg' },
    { title: 'Shantaram', author: 'Gregory David Roberts', category: 'Fiction', genre: ['Adventure'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333482282i/33600.jpg' },
    { title: 'The White Tiger', author: 'Aravind Adiga', category: 'Fiction', genre: ['Social Commentary'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327934446i/1768603.jpg' },
    { title: 'Sacred Games', author: 'Vikram Chandra', category: 'Fiction', genre: ['Crime', 'Thriller'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/113487.jpg' },
    { title: 'The Rozabal Line', author: 'Ashwin Sanghi', category: 'Thriller', genre: ['Mystery', 'Thriller'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/2064814.jpg' },
    { title: 'The Immortals of Meluha', author: 'Amish Tripathi', category: 'Mythology', genre: ['Fantasy', 'Mythology'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1358176414i/7913305.jpg' },
    { title: 'Two States', author: 'Chetan Bhagat', category: 'Romance', genre: ['Romance', 'Comedy'], condition: 'Fair', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/6969361.jpg' },
    { title: 'The Palace of Illusions', author: 'Chitra Banerjee Divakaruni', category: 'Mythology', genre: ['Mythology', 'Fiction'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/1774836.jpg' },

    // International Bestsellers
    { title: 'Harry Potter and the Philosopher\'s Stone', author: 'J.K. Rowling', category: 'Fantasy', genre: ['Fantasy', 'Young Adult'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', genre: ['Classic', 'Drama'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg' },
    { title: '1984', author: 'George Orwell', category: 'Fiction', genre: ['Dystopian', 'Political'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532714506i/40961427.jpg' },
    { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Philosophy', genre: ['Philosophy', 'Adventure'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg' },
    { title: 'Pride and Prejudice', author: 'Jane Austen', category: 'Romance', genre: ['Classic', 'Romance'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg' },
    { title: 'The Da Vinci Code', author: 'Dan Brown', category: 'Thriller', genre: ['Mystery', 'Thriller'], condition: 'Fair', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579621267i/968.jpg' },
    { title: 'Life of Pi', author: 'Yann Martel', category: 'Adventure', genre: ['Adventure', 'Philosophy'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1631251689i/4214.jpg' },
    { title: 'The Kite Runner', author: 'Khaled Hosseini', category: 'Fiction', genre: ['Historical Fiction', 'Drama'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579036753i/77203.jpg' },
    { title: 'Atomic Habits', author: 'James Clear', category: 'Self-Help', genre: ['Self-Help', 'Psychology'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg' },
    { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'History', genre: ['History', 'Anthropology'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329310i/23692271.jpg' },

    // Technical Books
    { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', genre: ['Programming', 'Software Engineering'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg' },
    { title: 'The Pragmatic Programmer', author: 'David Thomas', category: 'Technology', genre: ['Programming'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg' },
    { title: 'You Don\'t Know JS', author: 'Kyle Simpson', category: 'Technology', genre: ['JavaScript', 'Programming'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1465735726i/27833922.jpg' },

    // Business Books
    { title: 'Think and Grow Rich', author: 'Napoleon Hill', category: 'Business', genre: ['Business', 'Self-Help'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1463241782i/30186948.jpg' },
    { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', category: 'Finance', genre: ['Finance', 'Business'], condition: 'Fair', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388211242i/69571.jpg' },

    // Science Fiction
    { title: 'Dune', author: 'Frank Herbert', category: 'Science Fiction', genre: ['Science Fiction', 'Adventure'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg' },
    { title: 'Foundation', author: 'Isaac Asimov', category: 'Science Fiction', genre: ['Science Fiction'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1417900846i/29579.jpg' },

    // Mystery/Crime
    { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', category: 'Mystery', genre: ['Mystery', 'Crime'], condition: 'Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327868566i/2429135.jpg' },
    { title: 'Gone Girl', author: 'Gillian Flynn', category: 'Thriller', genre: ['Psychological Thriller'], condition: 'Like New', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1554086139i/19288043.jpg' },

    // Non-Fiction
    { title: 'Educated', author: 'Tara Westover', category: 'Biography', genre: ['Biography', 'Memoir'], condition: 'Very Good', coverImage: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1506026635i/35133922.jpg' }
];

// Helper Functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateRandomCoordinates = (baseCoords, radiusKm = 10) => {
    const [baseLng, baseLat] = baseCoords;
    // Convert km to degrees (approximate)
    const kmToDegrees = radiusKm / 111;

    const randomLat = baseLat + (Math.random() - 0.5) * 2 * kmToDegrees;
    const randomLng = baseLng + (Math.random() - 0.5) * 2 * kmToDegrees;

    return [randomLng, randomLat];
};

const generateUserProfile = () => {
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const firstName = getRandomElement(indianNames[gender]);
    const lastName = getRandomElement(indianNames.surnames);
    const city = getRandomElement(indianCities);
    const area = getRandomElement(city.addresses);

    // Generate avatar URL using generic placeholder service
    const avatarId = getRandomNumber(1, 100);
    const avatar = `https://i.pravatar.cc/300?img=${avatarId}`;

    // Create email and extract username for password
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomNumber(1, 999)}@gmail.com`;
    const username = email.split('@')[0]; // Extract part before @

    return {
        name: `${firstName} ${lastName}`,
        email: email,
        password: username, // Password matches username part of email
        avatar: avatar,
        location: {
            type: 'Point',
            coordinates: generateRandomCoordinates(city.coordinates),
            address: `${area}, ${city.name}, ${city.state}`
        },
        rating: {
            overallRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
            totalRatings: getRandomNumber(0, 25),
            breakdown: {
                communication: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                bookCondition: parseFloat((Math.random() * 2 + 3).toFixed(1)),
                timeliness: parseFloat((Math.random() * 2 + 3).toFixed(1))
            },
            trustLevel: getRandomElement(['new', 'fair', 'good', 'very_good', 'excellent']),
            badges: [],
            lastUpdated: new Date()
        },
        role: 'user',
        isActive: true,
        lastActive: new Date(Date.now() - getRandomNumber(0, 7) * 24 * 60 * 60 * 1000) // Last 7 days
    };
};

const generateBookForUser = (userId) => {
    const book = getRandomElement(popularBooks);

    return {
        title: book.title,
        author: book.author,
        category: book.category,
        description: `A wonderful ${book.category.toLowerCase()} book by ${book.author}. This book offers great insights and is perfect for readers interested in ${book.genre.join(', ').toLowerCase()}.`,
        isbn: `978${getRandomNumber(1000000000, 9999999999)}`,
        publicationYear: getRandomNumber(1990, 2023),
        condition: book.condition,
        language: 'English',
        genre: book.genre,
        tags: book.genre.map(g => g.toLowerCase()),
        rating: {
            average: parseFloat((Math.random() * 2 + 3).toFixed(1)),
            count: getRandomNumber(0, 50)
        },
        coverImage: book.coverImage || `https://picsum.photos/300/400?random=${getRandomNumber(1, 1000)}`,
        owner: userId,
        isAvailable: Math.random() > 0.2, // 80% available
        forBorrowing: true,
        viewCount: getRandomNumber(0, 100),
        borrowCount: getRandomNumber(0, 5)
    };
};

const seedDemoUsers = async () => {
    try {
        console.log('🚀 Starting demo user seeding process...');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if demo users already exist
        const existingDemoUsers = await User.find({ email: { $regex: /\d+@gmail\.com$/ } });
        if (existingDemoUsers.length > 0) {
            console.log(`⚠️  Found ${existingDemoUsers.length} existing demo users. Cleaning up...`);

            // Remove existing demo books
            const demoUserIds = existingDemoUsers.map(user => user._id);
            await Book.deleteMany({ owner: { $in: demoUserIds } });

            // Remove existing demo users
            await User.deleteMany({ email: { $regex: /\d+@gmail\.com$/ } });
            console.log('🧹 Cleaned up existing demo data');
        }

        console.log('👥 Creating 50 demo users...');
        const users = [];
        const books = [];

        // Create 50 users
        for (let i = 0; i < 50; i++) {
            const userProfile = generateUserProfile();

            // Hash password
            userProfile.password = await bcrypt.hash(userProfile.password, 12);

            const user = new User(userProfile);
            await user.save();
            users.push(user);

            // Generate books for this user (0-6 books randomly)
            const bookCount = getRandomNumber(0, 6);
            const userBooks = [];

            for (let j = 0; j < bookCount; j++) {
                const bookData = generateBookForUser(user._id);
                const book = new Book(bookData);
                await book.save();
                books.push(book);
                userBooks.push(book._id);
            }

            // Update user's booksOwned array
            user.booksOwned = userBooks;
            await user.save();

            console.log(`✅ Created user ${i + 1}/50: ${user.name} with ${bookCount} books`);
        }

        console.log('\n🎉 Demo user seeding completed successfully!');
        console.log(`📊 Summary:`);
        console.log(`   👥 Users created: ${users.length}`);
        console.log(`   📚 Books created: ${books.length}`);
        console.log(`   🌍 Cities covered: ${new Set(users.map(u => u.location.address.split(',')[1].trim())).size}`);

        // Display some statistics
        const bookDistribution = {};
        for (const user of users) {
            const count = user.booksOwned.length;
            bookDistribution[count] = (bookDistribution[count] || 0) + 1;
        }

        console.log(`\n📈 Book distribution:`);
        Object.entries(bookDistribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .forEach(([count, users]) => {
                console.log(`   ${count} books: ${users} users`);
            });

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

// Run the seeding
seedDemoUsers();