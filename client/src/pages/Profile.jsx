import { useDispatch, useSelector } from "react-redux"
import { useEffect, useRef, useState } from "react"
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from "firebase/storage"
import { app } from "../firebase"
import { Link } from "react-router-dom"
import {
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  signOutFailure,
  signOutSuccess,
  signOutStart
} from "../redux/user/userSlice.js"
const Profile = () => {
  const fileRef = useRef(null)
  const { currentUser, loading, error } = useSelector(state => state.user)
  const [file, setFile] = useState(undefined)
  const [filePercentage, setFilePercentage] = useState(0)
  const [fileUploadError, setFileUploadError] = useState(false)
  const [formData, setFormData] = useState({})
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [showListingError, setShowListingError] = useState(false)
  const [userListings, setUserListings] = useState([])

  const dispatch = useDispatch();

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file])

  const handleFileUpload = (file) => {
    const storage = getStorage(app);

    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, fileName)
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePercentage(Math.round(progress))
      },
      (error) => {
        setFileUploadError(error)
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(
          ((downloadURL) => {
            setFormData({ ...formData, avatar: downloadURL })
          })
        )
      }
    )
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserStart());

      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/user/update/${currentUser._id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      );
      const data = await res.json();
      if (data.success === false) {

        dispatch(updateUserFailure(data.message))
        return;
      }
      dispatch(updateUserSuccess(data))
      setUpdateSuccess(true)
    } catch (error) {
      dispatch(updateUserFailure(error.message))
    }
  }



  const handleDeleteUser = async () => {
    try {
      dispatch(deleteUserStart());
      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/user/delete/${currentUser._id}`,
        {
          method: 'DELETE',
        }
      )
      const data = res.json();

      if (data.success === false) {
        dispatch(deleteUserFailure())
        return
      }
      dispatch(deleteUserSuccess(data))

    } catch (error) {
      dispatch(deleteUserFailure(error.message))
    }

  }

  const handleSignOut = async () => {
    try {
      dispatch(signOutStart())
      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/auth/signout`)
      const data = res.json();
      if (data.success === false) {
        dispatch(signOutFailure(error))
        return
      }
      dispatch(signOutSuccess(data))

    } catch (error) {
      dispatch(signOutFailure(error))
    }
  }
  const handleShowListings = async () => {

    if (!currentUser || !currentUser._id) {
      console.error('User ID is not available');
      setShowListingError(true);
      return;
    }
  
    
    try {
      setShowListingError(false)
      
      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/user/listings/${currentUser._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', 
      });
      // console.log(res.json());
      const data = await res.json();
      console.log(data);
      
      if (!res.ok) {
        throw new Error('Failed to fetch user listings');
      }

      
      if (data.success === false) {
        showListingError(true)
        return
      }
      setUserListings(data)
      
      
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setShowListingError(true)
    }
  }
  const handleListingDelete =async(listingId)=>{
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/listing/delete/${listingId}`,{
        method:"DELETE",
      })
      const data = res.json()
      if(data.success ===false){
        console.log(data.message);
        return        
      }
      setUserListings((prev)=> prev.filter((listing)=>listing._id!==listingId))
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <div className="p-3 max-w-lg mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Profile</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" >
        <input type="file" onChange={(e) => setFile(e.target.files[0])} ref={fileRef} hidden accept="image/*" />
        <img onClick={() => fileRef.current.click()} className="rounded-full h-24 w-24 object-cover cursor-pointer  self-center mt-2" src={formData.avatar || currentUser.avatar} alt="Profile Image" />
        <p className="text-sm self-center" >{fileUploadError ? (
          <span className="text-red-700" >
            Error Image Upload(image must be less than 2MB)</span>) :
          filePercentage > 0 && filePercentage < 100 ? (
            <span className="text-slate-700" >
              {`Uploading ${filePercentage}%`}
            </span>)
            :
            filePercentage === 100 ? (
              <span className="text-green-700" >Image successfully uploaded!</span>)
              : (
                ""
              )
        }
        </p>
        <input
          className="border p-3 rounded-lg"
          id="username"
          defaultValue={currentUser.username}
          type="text"
          placeholder="Username"
          onChange={handleChange}
        />
        <input
          className="border p-3 rounded-lg"
          id="email"
          defaultValue={currentUser.email}
          type="text"
          placeholder="Email"
          onChange={handleChange}
        />
        <input
          className="border p-3 rounded-lg"
          id="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="bg-slate-700 text-white rounded-lg p-3 uppercase hover:opacity-95 disabled:opacity-80 ">
          {loading ? "Loading..." : "Update"}
        </button>
        <Link className="bg-green-700 text-white p-3 rounded-lg uppercase text-center hover:opacity-95" to="/create-listing">
          Create Listing
        </Link>
      </form>
      <div className="flex justify-between items-center mt-5 ">
        <span className="text-red-700 cursor-pointer" onClick={handleDeleteUser} > Delete account </span>
        <span className="text-red-700 cursor-pointer" onClick={handleSignOut} > Sign out </span>
      </div>
      <div>
        <p className="text-red-700 mt-5" >{error ? error : ''}</p>
        <p className="text-green-700 mt-5" >{updateSuccess ? "User updated successfully" : ''}</p>
        <button className="text-green-700 w-full " onClick={handleShowListings} >Show listings</button>
        <p className="text-red-700 mt-5" >{showListingError ? "Error showing listings" : ''}</p>
        

        {userListings && userListings.length > 0 &&
        <div className="flex flex-col gap-4">
          <h1 className="text-center mt-7 text-2xl font-semibold" >Your Listings</h1>
        {userListings.map(listing=>(
          <div key={listing._id} className="border rounded-lg p-3 flex justify-between items-center gap-4" >
            <Link to={`/listing/${listing._id}`}>
            <img 
            className="h-16 w-16 object-contain" 
            src={listing.imageUrls[0]} 
            alt="listing image" />
            </Link>
            <Link className="flex-1 text-slate-700 font-semibold  hover:underline truncate" to={`/listing/${listing._id}`} >
            <p className="" >{listing.name}</p>
            </Link>
            <div className="flex flex-col items-center" >
              <button onClick={()=>handleListingDelete(listing._id)} className="uppercase text-red-700">Delete</button>
              <Link to={`/update-listing/${listing._id}`}>
              <button className="uppercase text-green-700">Edit</button>
              </Link>
            </div>
          </div>
        ))}
        </div>
      }
          
      </div>
    </div>
  )
}

export default Profile