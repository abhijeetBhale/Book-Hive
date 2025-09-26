import React, { createContext, useState, useEffect } from 'react';
import { booksAPI } from '../utils/api';
import toast from 'react-hot-toast';

export const BookContext = createContext(null);

export const BookProvider = ({ children }) => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});

    const fetchBooks = async (params = {}) => {
        setLoading(true);
        try {
            const { data } = await booksAPI.getAll(params);
            setBooks(data.books);
            setPagination(data.pagination);
        } catch (error) {
            toast.error('Failed to fetch books.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchBooks();
    }, []);

    const value = {
        books,
        setBooks,
        loading,
        pagination,
        fetchBooks
    };

    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    );
};