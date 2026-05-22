import {styled, keyframes} from 'styled-components'; 

const upAndDown = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

export const Button = styled.div` 
position: fixed; 
left: 95vw; 
bottom: 7vh; 
height: 20px; 
font-size: 2.5rem; 
z-index: 1; 
cursor: pointer; 
color: rgb(150, 150, 150); 
transition: background-color 0.3s, transform 0.3s;
animation: ${upAndDown} 1s infinite ease-in-out;

&:hover {
    color: rgba(150, 150, 150, 0.7);
    transform: translateY(-2px);
}

@media (max-width: 1600px) {
    left: 93vw;
}

@media (max-width: 1000px) {
    left: 90vw;
}

@media (max-width: 560px) {
    left: 85vw;
}

`
