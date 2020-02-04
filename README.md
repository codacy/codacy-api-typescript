# codacy-api-typescript
Typescript wrapper for the Codacy API

## Usage
### Generate the code
```bash
API_VERSION=[version] .\generate.sh
```

### Mock an API server
```bash
.\mock-api.sh
```

### Using the library in React
Locally, run `yarn link` from this project root folder, and then run `yarn link @codacy/api-typescript` on the project you want to use it. The best practice for using this library would be:

#### 1. Creating a context
```typescript
import React from 'react'
import { Client } from '@codacy/api-typescript'

const AppContext = React.createContext<Client | null>(null)

export default AppContext
```

#### 2. Wrapping your app in that context provider
```typescript
...
import ApiContext from './ApiContext'
import { Client } from '@codacy/api-typescript'
...
const App: React.FC = () => {
  return (
    <ApiContext.Provider
        value={
            new Client({
                baseUri: process.env.REACT_APP_CODACY_API_URI,
            })
        }>
    {/* Your app's code here */}
    </ApiContext.Provider>
...
```

#### 3. Using the client's context to fetch data
```typescript
import React, { useState, useEffect, useContext } from 'react'
import ApiContext from '../ApiContext'
import { User, ApiError } from '@codacy/api-typescript/esm/models'

export interface UserInformationProps {
  id: number
}

export const UserInformation: React.FC<UserInformationProps> = ({ id }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User>()
  const [error, setError] = useState<ApiError>()
  const client = useContext(ApiContext)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await client!.getUser(id)

        setUser(response!.data)
        setIsLoading(false)
      } catch (err) {
        setError(err as ApiError)
      }
    }

    fetchUser()
  }, [client, id])

  return (
    <>
      {isLoading && <span>Loading ...</span>}
      {!!user && (
        <span>
          {user.username} ({user.mainEmail})
        </span>
      )}
      {!isLoading && !!error && (
        <span>
          {error.message} ({error.code})
        </span>
      )}
    </>
  )
}
```

## Developement
### Requirements
  - Autorest (`npm install -g autorest`)

## What is Codacy
[Codacy](https://www.codacy.com/) is an Automated Code Review Tool that monitors your technical debt, helps you improve your code quality, teaches best practices to your developers, and helps you save time in Code Reviews.

## Free for Open Source
Codacy is free for Open Source projects.

## License
codacy-api-typescript is available under the MIT license. See the LICENSE file for more info.