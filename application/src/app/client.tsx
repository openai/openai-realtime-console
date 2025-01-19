'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const App = dynamic(() => import('../components/App'), { ssr: false })

export function ClientOnly() {
    return <App />
}

