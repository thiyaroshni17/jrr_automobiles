import React from 'react'
import { Routes,Route } from 'react-router-dom'
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import Landing from './pages/landing';
import Resetpassword from './pages/resetpassword';
import Home from './pages/home';
import Login from './pages/login';
import Jobcard from './pages/jobcard';
import Jobcardhome from './pages/jobcardhome';
import PettyCashHome from './pages/Pettycashhome.jsx';
import PettyCashPage from './pages/pettycash.jsx';
import WaterWashHome from './pages/waterwashhome.jsx';
import WaterWashPage from './pages/waterwash.jsx';
import BodyShopHome from './pages/bodyshophome.jsx';
import BodyShopPage from './pages/bodyshop.jsx';

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Landing/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/home' element={<Home/>}/>
       <Route path="/jobcard/create" element={<Jobcard />} />
      <Route path="/jobcard/:id" element={<Jobcard />} />
         <Route path='/jobcardhome' element={<Jobcardhome/>}/>
        <Route path='/resetpass' element={<Resetpassword/>}/>
        <Route path='/pettycashhome' element={<PettyCashHome/>}/>
         <Route path='/pettycash/create' element={<PettyCashPage/>}/>
         <Route path='/pettycash/:id' element={<PettyCashPage/>}/>
         <Route path='/waterwashhome' element={<WaterWashHome/>}/>
         <Route path='/waterwash/create' element={<WaterWashPage/>}/>
         <Route path='/waterwash/:id' element={<WaterWashPage/>}/>
         <Route path='/bodyshophome' element={<BodyShopHome/>}/>
         <Route path='/bodyshop/create' element={<BodyShopPage/>}/>
         <Route path='/bodyshop/:id' element={<BodyShopPage/>}/>
      </Routes>
    </div>
  )
}

export default App