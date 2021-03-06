import { createContext, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBlog } from "../hooks/useBlog";
import { api } from "../services/api";

interface AuthContextData{
  user: UserType | null;
  error: string;
  isLoading: boolean;
  changeIsLoading: (bool: boolean) => void
  signUp: (name: string, email: string, password: string) => void
  signIn: (email: string, password: string) => void
  signOut: () => void
  changeError: (message: string) => void
}

interface AuthContextProviderProps{
  children: ReactNode;
}

interface UserType{
  _id: string;
  name: string;
  email: string;
  password: string;
}

interface Response{
  token: string;
  user: UserType;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthContextProvider({children}: AuthContextProviderProps){
  const [user, setUser] = useState<UserType | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { currentBlogCode, resetCurrentBlogCode, accessPersonalBlog } = useBlog()

  async function signUp(name: string, email: string, password: string){
    setIsLoading(true)
    try{
      const response = await api.post<Response>('/register', { name, email, password })
      
      changeError('')
      navigate('/signin')
      resetCurrentBlogCode()
    }catch(error: any){
      const { data } = error.response ?? ''

      if(data?.msg){
        setError(data.msg)
      }else{
        setError('Something went wrong. Please try later.')
      }
    }
    setIsLoading(false)
  }

  async function signIn(email: string, password: string){
    setIsLoading(true)
    try{
      const response = await api.post<Response>('/authenticate', { email, password })
      const { token, user } = response.data

      api.defaults.headers.common.authorization = `Bearer ${token}`
      localStorage.setItem('@blogsy:token', token)

      setUser(user)
      changeError('')
      if(currentBlogCode){
        navigate(`/blog/${currentBlogCode}`)
      }
    }catch(error: any){
      const { data } = error.response

      if(data?.msg){
        setError(data.msg)
      }else{
        setError('Something went wrong. Please try later.')
      }
    }
    setIsLoading(false)
  }

  function signOut(){
    setUser(null)
    localStorage.removeItem('@blogsy:token')
  }

  function changeError(message: string){
    setError(message)
  }

  function changeIsLoading(bool: boolean){
    setIsLoading(bool)
  }

  useEffect(() =>{
    const token = localStorage.getItem('@blogsy:token')

    if(token){
      api.defaults.headers.common.authorization = `Bearer ${token}`

      api.get<UserType>('/user').then(response =>{
        setUser(response.data)
      })
    }
  }, [])

  return(
    <AuthContext.Provider value={{
      user,
      error,
      isLoading,
      changeIsLoading,
      signUp,
      signIn,
      signOut,
      changeError
    }}>
      { children }
    </AuthContext.Provider>
  )
}