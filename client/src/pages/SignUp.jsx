import { useState } from "react"
import { Link,useNavigate } from "react-router-dom"
import OAuth from "../components/OAuth"

const SignUp = () => {

  const navigate =useNavigate()

  const [formData, setFormData] = useState({})
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      
      setLoading(true)
      const res = await fetch(`${import.meta.env.VITE_SERVER_PREFIX}/api/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      if (data.success === false) {
        setError(data.message)
        setLoading(false);
        return
      }
      setLoading(false)
      setError(null)
      navigate('/sign-in')
    } catch (err) {
      setLoading(false)
      setError(err.message)
    }
  }


  return (
    <div className="p-3 max-w-lg mx-auto" >
      <h1 className="text-3xl text-center font-semibold my-7" >Sign Up</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder='Username'
          className="border p-3 rounded-lg"
          id='username'
          onChange={handleChange}
        />
        <input
          type="email"
          placeholder='Email'
          className="border p-3 rounded-lg"
          id='email'
          onChange={handleChange}
        />
        <input
          type="password"
          placeholder='Password'
          className="border p-3 rounded-lg"
          id='password'
          onChange={handleChange}
        />
        <button
          disabled={loading}
          className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
        >
          {loading?'Loading...':'Sign Up'}
        </button>
        <OAuth/>
      </form>
      <div className="flex gap-2 mt-5">
        <p>Have an account?</p>
        <Link
          className="text-blue-700"
          to='/sign-in'
        >Sign in</Link>
      </div>
      {error && <p className="text-red-500 mt-5">{error}</p>}
    </div>
  )
}

export default SignUp