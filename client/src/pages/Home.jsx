import { useEffect, useState } from "react";
import {io} from 'socket.io-client';
import {useNavigate} from 'react-router-dom'; 


const Home = ()=>{
    const navigate = useNavigate();

  const [name, setName] = useState('');
  const [roomid, setRoomid] = useState('');
  

  const handleClick = (e)=>{
    e.preventDefault();
    if(!name || !roomid){
      console.log("name and room-id required");
      return;
    }

    navigate(`/room/${roomid}`, {
        state: {
            name,
        }
    })
  }

  return (
    <> 


<div className="flex flex-col justify-between items-center h-140 m-7">
        <h1 className="bg-amber-50 text-6xl border border-solid p-5">
          CHAT APPLICATION
        </h1>

        <div className="max-w-[50p%] m-7 border-7 rounded-3xl border-solid border-green-700 p-5 bg-amber-50">
          <div className="name m-7 flex justify-between">
            <label htmlFor="username" className="mx-5 p-1">Username</label>
            <input type="text" className="border border-solid p-1" placeholder="name" value={name} onChange={(e)=>setName(e.target.value)}/>
          </div>

          <div className="id m-7 flex justify-between">
            <label htmlFor="username" className="mx-5 p-1">Room-id</label>
            <input type="text" className="border border-solid p-1" placeholder="room-id" value={roomid} onChange={(e)=>setRoomid(e.target.value)}/>
          </div>

          <button className="bg-amber-300 w-[100%] p-3" onClick={handleClick}>Join</button>
        </div>
      </div>
    </>
  )
}

export default Home;