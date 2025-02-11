import {Route, Routes, BrowserRouter} from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import { useEffect, useState } from 'react';
import PrivateChat from './pages/PrivateChat';

function App() {
  return(
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/room/:id' element={<Chat/>}/>
        <Route path='/private/:id' element={<PrivateChat/>}/>
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
