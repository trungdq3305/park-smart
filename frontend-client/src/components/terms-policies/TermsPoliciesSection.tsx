import React, { useState, useMemo, useRef } from 'react'
import type { TermPolicy } from '../../types/termPolicty'
import './TermsPoliciesSection.css'

interface TermsPoliciesSectionProps {
  data: TermPolicy[]
  isLoading: boolean
}

const TermsPoliciesSection: React.FC<TermsPoliciesSectionProps> = ({ data, isLoading }) => {
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const headerRef = useRef<HTMLDivElement>(null)
  const observersRef = useRef<{
    headerObserver?: IntersectionObserver
    itemsObserver?: IntersectionObserver
  }>({})

  // Memoized observer options
  const observerOptions = useMemo(
    () => ({
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }),
    []
  )

  const headerObserverOptions = useMemo(
    () => ({
      threshold: 0.1,
    }),
    []
  )

  // Memoized observer callbacks
  const handleHeaderIntersection = useMemo(
    () => (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      setIsHeaderVisible(entry.isIntersecting)
    },
    []
  )

  const handleItemsIntersection = useMemo(
    () => (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const itemId = entry.target.getAttribute('data-item-id')
        if (itemId) {
          setVisibleItems((prev) => {
            const newSet = new Set(prev)
            if (entry.isIntersecting) {
              newSet.add(itemId)
            } else {
              newSet.delete(itemId)
            }
            return newSet
          })
        }
      })
    },
    []
  )

  // Memoized observers setup
  const observers = useMemo(() => {
    // Cleanup existing observers
    if (observersRef.current.headerObserver) {
      observersRef.current.headerObserver.disconnect()
    }
    if (observersRef.current.itemsObserver) {
      observersRef.current.itemsObserver.disconnect()
    }

    // Create new observers
    const headerObserver = new IntersectionObserver(handleHeaderIntersection, headerObserverOptions)
    const itemsObserver = new IntersectionObserver(handleItemsIntersection, observerOptions)

    observersRef.current = { headerObserver, itemsObserver }

    return { headerObserver, itemsObserver }
  }, [handleHeaderIntersection, handleItemsIntersection, observerOptions, headerObserverOptions])

  // Memoized ref callback for items
  const setItemRef = useMemo(
    () => (id: string) => (element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(id, element)
        // Observe the new element immediately
        if (observersRef.current.itemsObserver) {
          observersRef.current.itemsObserver.observe(element)
        }
      } else {
        itemRefs.current.delete(id)
      }
    },
    []
  )

  // Memoized header ref callback
  const headerRefCallback = useMemo(
    () => (element: HTMLDivElement | null) => {
      if (element) {
        headerRef.current = element
        if (observersRef.current.headerObserver) {
          observersRef.current.headerObserver.observe(element)
        }
      }
    },
    []
  )

  // Memoized cleanup function
  const cleanup = useMemo(
    () => () => {
      if (observersRef.current.headerObserver) {
        observersRef.current.headerObserver.disconnect()
      }
      if (observersRef.current.itemsObserver) {
        observersRef.current.itemsObserver.disconnect()
      }
    },
    []
  )

  // Initialize observers on mount
  React.useLayoutEffect(() => {
    observers
    return cleanup
  }, [observers, cleanup])

  // Update items observers when data changes
  React.useLayoutEffect(() => {
    if (observersRef.current.itemsObserver) {
      itemRefs.current.forEach((element) => {
        if (element) {
          observersRef.current.itemsObserver!.observe(element)
        }
      })
    }
  }, [data])

  // Memoized loading state
  const loadingContent = useMemo(
    () => (
      <div className="terms-page">
        <div className="container">
          <div className="page-header">
            <h1>Terms & Policies</h1>
            <p>Important legal information</p>
          </div>
          <div className="loading-content">
            <div className="skeleton-text long"></div>
            <div className="skeleton-text medium"></div>
            <div className="skeleton-text short"></div>
          </div>
        </div>
      </div>
    ),
    []
  )

  // Memoized empty state
  const emptyContent = useMemo(
    () => (
      <div className="terms-page">
        <div className="container">
          <div className="page-header">
            <h1>Terms & Policies</h1>
            <p>Important legal information</p>
          </div>
          <div className="empty-state">
            <p>No terms and policies information</p>
          </div>
        </div>
      </div>
    ),
    []
  )

  // Memoized terms items
  const termsItems = useMemo(
    () =>
      data.map((item, index) => (
        <div
          key={item.id}
          ref={setItemRef(item.id)}
          data-item-id={item.id}
          className={`terms-item ${visibleItems.has(item.id) ? 'animate-in' : ''}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <h2 className="terms-title">{item.title}</h2>
          <div className="terms-meta">
            <span className="meta-date">
              Last updated:{' '}
              {item?.updatedAt
                ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
                : new Date(item.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="terms-description">
            <p>{item.description}</p>
          </div>
          <div className="terms-body">
            {item.content.split('\n').map((paragraph, index) => (
              <p key={index} className="terms-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )),
    [data, visibleItems, setItemRef]
  )

  if (isLoading) {
    return loadingContent
  }

  if (!data || data.length === 0) {
    return emptyContent
  }

  return (
    <div className="terms-page">
      <div className="container">
        <div
          ref={headerRefCallback}
          className={`page-header ${isHeaderVisible ? 'animate-in' : ''}`}
        >
          <h1>Terms & Policies</h1>
          <p>Important legal information</p>
        </div>

        <div className="terms-content">{termsItems}</div>
      </div>
    </div>
  )
}

export default TermsPoliciesSection
