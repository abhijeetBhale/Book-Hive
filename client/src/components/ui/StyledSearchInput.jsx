import React from 'react';
import styled from 'styled-components';

const StyledWrapper = styled.div`
  .group {
    display: flex;
    line-height: 28px;
    align-items: center;
    position: relative;
    max-width: 400px; /* Increased width to fit better */
    margin: 0 auto; /* Center the search bar */
  }

  .input {
    height: 50px; /* Increased height for better presence */
    line-height: 28px;
    padding: 0 1rem;
    width: 100%;
    padding-left: 2.5rem;
    border: 2px solid transparent;
    border-radius: 12px; /* Slightly more rounded */
    outline: none;
    background-color: #f3f3f3; /* Neutral background */
    color: #0d0c22;
    transition: .3s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);

    &:focus {
      border-color: #4F46E5;
      background-color: white;
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
    }
  }

  .input::placeholder {
    color: #777;
  }

  .icon {
    position: absolute;
    left: 1rem;
    fill: #777;
    width: 1rem;
    height: 1rem;
    z-index: 1;
  }
`;

const StyledSearchInput = ({ value, onChange, placeholder }) => {
  return (
    <StyledWrapper>
      <div className="group">
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
          <g>
            <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
          </g>
        </svg>
        <input
          placeholder={placeholder}
          type="search"
          className="input"
          value={value}
          onChange={onChange}
        />
      </div>
    </StyledWrapper>
  );
}

export default StyledSearchInput;