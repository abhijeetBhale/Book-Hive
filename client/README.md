# BookHive - Share Your Thoughts

*A revolutionary platform for book lovers to connect, share, and discover new literary adventures.*

## About The Project

BookHive is a full-stack web application designed to bring book enthusiasts together in a vibrant online community. In a world where reading can sometimes feel like a solitary activity, BookHive provides a space for users to share their literary journeys, exchange thoughts on their favorite books, and discover new titles through peer recommendations. Our platform goes beyond simple book cataloging, offering a range of interactive features that foster a sense of community and make reading a more social and engaging experience.

At its core, BookHive allows users to create a personal library of books they have read, are currently reading, or want to read. But the magic happens when users start sharing their thoughts and reviews. Each book entry becomes a hub for discussion, where users can leave comments, ask questions, and engage in meaningful conversations with fellow readers. This creates a dynamic and ever-growing repository of user-generated content that helps others discover their next great read.

But BookHive is more than just a book review site. We've incorporated a unique book-borrowing feature that allows users to connect with others in their local area to borrow and lend physical copies of books. This not only promotes a culture of sharing and sustainability but also provides an opportunity for users to connect in the real world, building a true community of book lovers.

To further enhance the user experience, we've included a range of features such as user profiles, follow functionality, and a messaging system, allowing users to connect on a more personal level. We've also implemented a powerful search and filtering system, making it easy to find specific books, authors, or genres. And with our integrated map view, users can visualize the location of available books, making it easier than ever to find their next read.

Whether you're a casual reader looking for your next page-turner or a die-hard bibliophile wanting to share your passion with like-minded individuals, BookHive is the perfect platform for you.

### Key Features:

* **Personalized Bookshelves:** Curate and manage your own virtual library.
* **Book Reviews and Ratings:** Share your thoughts and discover what others are saying.
* **Community Engagement:** Comment on reviews and engage in discussions.
* **Book Borrowing and Lending:** Connect with local users to share physical books.
* **User Profiles and Following:** Build your literary network.
* **Private Messaging:** Connect with other users one-on-one.
* **Powerful Search and Filtering:** Easily find books, authors, and genres.
* **Interactive Map View:** Discover books available for borrowing in your area.

## Built With

This project is built with a modern, robust, and scalable tech stack, ensuring a seamless and enjoyable user experience.

### Front-End

* **React:** A popular JavaScript library for building user interfaces.
* **React Router:** For declarative routing in a React application.
* **Axios:** A promise-based HTTP client for making requests to our back-end API.
* **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
* **Framer Motion:** For creating beautiful and fluid animations.
* **Leaflet:** An open-source JavaScript library for interactive maps.
* **React-Leaflet:** React components for Leaflet maps.
* **LottieFiles:** For adding high-quality, lightweight animations.
* **Styled-Components:** For component-level styling.

### Back-End

* **Node.js:** A JavaScript runtime environment for building server-side applications.
* **Express.js:** A fast, unopinionated, and minimalist web framework for Node.js.
* **MongoDB:** A NoSQL database for storing our application data.
* **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
* **JWT (JSON Web Tokens):** For secure user authentication.
* **Passport.js:** For authentication with various strategies, including Google OAuth.
* **Cloudinary:** For cloud-based image and video management.
* **Nodemailer:** For sending emails (e.g., for password resets and notifications).
* **Socket.IO:** For real-time, bidirectional communication between clients and servers.
* **Bcrypt.js:** For hashing passwords before storing them in the database.
* **Express-rate-limit:** For rate-limiting requests to prevent abuse.
* **Helmet:** For securing our Express app by setting various HTTP headers.

## Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

* **Node.js and npm:** Make sure you have Node.js and npm installed on your machine. You can download them from [https://nodejs.org/](https://nodejs.org/).
* **MongoDB:** You'll need a running instance of MongoDB. You can either install it locally or use a cloud service like MongoDB Atlas.

### Client

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your_username/BookHive-Share-Your-Thoughts.git](https://github.com/your_username/BookHive-Share-Your-Thoughts.git)
    ```
2.  **Navigate to the client directory:**
    ```sh
    cd BookHive-Share-Your-Thoughts/client
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Create a `.env` file in the client directory and add the following environment variables:**
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```
5.  **Start the client:**
    ```sh
    npm run dev
    ```

### Server

1.  **Navigate to the server directory:**
    ```sh
    cd ../server
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Create a `.env` file in the server directory and add the following environment variables:**
    ```env
    PORT=5000
    MONGODB_URI=<your_mongodb_uri>
    JWT_SECRET=<your_jwt_secret>
    CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
    CLOUDINARY_API_KEY=<your_cloudinary_api_key>
    CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
    EMAIL_HOST=<your_email_host>
    EMAIL_PORT=<your_email_port>
    EMAIL_USER=<your_email_user>
    EMAIL_PASS=<your_email_pass>
    ```
4.  **Start the server:**
    ```sh
    npm run dev
    ```

## Usage

Once you have the application running, you can:

* Create an account or log in with your existing credentials.
* Browse the collection of books added by other users.
* Add your own books to the library, along with reviews and ratings.
* Comment on other users' reviews and engage in discussions.
* Search for books by title, author, or genre.
* Find books available for borrowing in your area using the interactive map.
* Request to borrow books from other users.
* Manage your own borrowing and lending requests.
* Follow other users to stay updated on their literary activities.
* Send and receive private messages with other users.

## Roadmap

We have a lot of exciting features planned for the future of BookHive, including:

* **Book Clubs:** Create and join virtual book clubs with other users.
* **Reading Challenges:** Participate in reading challenges and track your progress.
* **Personalized Recommendations:** Get book recommendations based on your reading history and preferences.
* **Author Pages:** Discover new authors and follow their work.
* **Integration with Goodreads:** Sync your Goodreads data with your BookHive account.
* **Mobile App:** A dedicated mobile app for iOS and Android devices.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!

1.  **Fork the Project**
2.  **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the Branch** (`git push origin feature/AmazingFeature`)
5.  **Open a Pull Request**

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Abhijeet Bhale -  abhijeetbhale7@gmail.com

Project Link: [https://github.com/abhijeetbhale/bookhive-share-your-thoughts](https://github.com/abhijeetbhale/bookhive-share-your-thoughts)

## Acknowledgments

* [Create React App](https://github.com/facebook/create-react-app)
* [Node.js](https://nodejs.org/)
* [Express.js](https://expressjs.com/)
* [MongoDB](https://www.mongodb.com/)
* [Mongoose](https://mongoosejs.com/)
* [Cloudinary](https://cloudinary.com/)
* And all the other amazing open-source libraries that made this project possible!