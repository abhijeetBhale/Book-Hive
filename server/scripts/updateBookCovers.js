import mongoose from 'mongoose';
import Book from '../models/Book.js';
import 'dotenv/config';

// Book cover mapping - matches titles to their correct cover images
const bookCoverMap = {
  'The God of Small Things': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1309203843i/9777.jpg',
  'Midnight\'s Children': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1385738769i/14836.jpg',
  'The Mahabharata: A Modern Rendering': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552449i/307797.jpg',
  'Shantaram': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1333482282i/33600.jpg',
  'The White Tiger': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327934446i/1768603.jpg',
  'Sacred Games': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/113487.jpg',
  'The Rozabal Line': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/2064814.jpg',
  'The Immortals of Meluha': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1358176414i/7913305.jpg',
  'Two States': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/6969361.jpg',
  'The Palace of Illusions': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320552082i/1774836.jpg',
  'Harry Potter and the Philosopher\'s Stone': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1474154022i/3.jpg',
  'To Kill a Mockingbird': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1553383690i/2657.jpg',
  '1984': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1532714506i/40961427.jpg',
  'The Alchemist': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg',
  'Pride and Prejudice': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1320399351i/1885.jpg',
  'The Da Vinci Code': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579621267i/968.jpg',
  'Life of Pi': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1631251689i/4214.jpg',
  'The Kite Runner': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1579036753i/77203.jpg',
  'Atomic Habits': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1535115320i/40121378.jpg',
  'Sapiens': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329310i/23692271.jpg',
  'Clean Code': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg',
  'The Pragmatic Programmer': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1401432508i/4099.jpg',
  'You Don\'t Know JS': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1465735726i/27833922.jpg',
  'Think and Grow Rich': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1463241782i/30186948.jpg',
  'Rich Dad Poor Dad': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1388211242i/69571.jpg',
  'Dune': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1555447414i/44767458.jpg',
  'Foundation': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1417900846i/29579.jpg',
  'The Girl with the Dragon Tattoo': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1327868566i/2429135.jpg',
  'Gone Girl': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1554086139i/19288043.jpg',
  'Educated': 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1506026635i/35133922.jpg'
};

const updateBookCovers = async () => {
  try {
    console.log('📚 Starting book cover update process...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all books
    const books = await Book.find({});
    console.log(`📊 Found ${books.length} books to check`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const book of books) {
      const correctCoverImage = bookCoverMap[book.title];
      
      if (correctCoverImage && book.coverImage !== correctCoverImage) {
        // Update the book with correct cover image
        await Book.findByIdAndUpdate(book._id, {
          coverImage: correctCoverImage
        });
        
        updatedCount++;
        console.log(`✅ Updated cover for: ${book.title}`);
      } else if (correctCoverImage) {
        skippedCount++;
        console.log(`⏭️  Already correct: ${book.title}`);
      } else {
        skippedCount++;
        console.log(`❓ No cover mapping found for: ${book.title}`);
      }
    }

    console.log('\n🎉 Book cover update completed!');
    console.log(`📊 Summary:`);
    console.log(`   📚 Total books: ${books.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    
    if (updatedCount > 0) {
      console.log('\n🎯 All matching books now have correct cover images!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
};

// Run the update
updateBookCovers();