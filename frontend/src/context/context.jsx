import { useState } from "react";
import { createContext } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useEffect } from "react";

export const AppContent = createContext()

export const AppContextProvider = (props)=>{
    
    axios.defaults.withCredentials=true;
    const backendurl = import.meta.env.VITE_BACKEND_URL
    const [isloggedin,setisloggedin] = useState(false)
    const [userdata,setuserdata] = useState(false)

    const getuserdata = async()=>{
        try{
           const response = await axios.get(backendurl + '/data') 
           const user = response.data
           user.success ? setuserdata(user.userdata) : console.log(user.message)
           
        }catch(e){
            console.log(e.message)
        }
    }
    const isauthenticated = async()=>{
        axios.defaults.withCredentials=true
        try{
       const {islogged} = axios.get(backendurl + "/isauth")
       if(islogged.success){
        setisloggedin(true)
        getuserdata()
       }
        }catch(e){
            console.log(e.message)
        }
    }
    useEffect(()=>{
        isauthenticated()
     },[])
    const value ={
        backendurl,
        isloggedin,
        setisloggedin,
        userdata,
        setuserdata,
        getuserdata,
        isauthenticated
    }
    return(
        <AppContent.Provider value={value}>
            {props.children}
        </AppContent.Provider>
    )
}

