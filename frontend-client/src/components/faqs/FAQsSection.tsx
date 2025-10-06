import React, { useState, useMemo, useRef } from 'react'
import type { FAQ } from '../../types/faqs'
import './FAQsSection.css'

interface FAQsSectionProps {
  data: FAQ[]
  isLoading: boolean
}

const FAQsSection: React.FC<FAQsSectionProps> = ({ data, isLoading }) => {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set())
  const [isHeaderVisible, setIsHeaderVisible] = useState(false)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const sectionRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Memoized observer for scroll animations
  const observer = useMemo(() => {
    return new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute('data-faq-id')
          if (itemId) {
            if (entry.isIntersecting) {
              setVisibleItems((prev) => new Set([...prev, itemId]))
            } else {
              setVisibleItems((prev) => {
                const newSet = new Set(prev)
                newSet.delete(itemId)
                return newSet
              })
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    )
  }, [])

  // Header animation observer
  const headerObserver = useMemo(() => {
    return new IntersectionObserver(
      ([entry]) => {
        setIsHeaderVisible(entry.isIntersecting)
      },
      { threshold: 0.1 }
    )
  }, [])

  // Setup observers
  React.useLayoutEffect(() => {
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    if (headerRef.current) {
      headerObserver.observe(headerRef.current)
    }
    return () => {
      observer.disconnect()
      headerObserver.disconnect()
    }
  }, [observer, headerObserver])

  const toggleFAQ = (id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const setItemRef = useMemo(
    () => (id: string) => (element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(id, element)
        observer.observe(element)
      } else {
        const existingElement = itemRefs.current.get(id)
        if (existingElement) {
          observer.unobserve(existingElement)
          itemRefs.current.delete(id)
        }
      }
    },
    [observer]
  )

  if (isLoading) {
    return (
      <section id="faqs" ref={sectionRef} className="faqs-section">
        <div className="container">
          <div ref={headerRef} className={`section-header ${isHeaderVisible ? 'animate-in' : ''}`}>
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about our parking system</p>
          </div>
          <div className="loading-content">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="skeleton-faq">
                <div className="skeleton-question"></div>
                <div className="skeleton-answer"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!data || data.length === 0) {
    return (
      <section id="faqs" ref={sectionRef} className="faqs-section">
        <div className="container">
          <div ref={headerRef} className={`section-header ${isHeaderVisible ? 'animate-in' : ''}`}>
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about our parking system</p>
          </div>
          <div className="empty-state">
            <p>No FAQs available at the moment</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="faqs" ref={sectionRef} className="faqs-section">
      <div className="container">
        <div ref={headerRef} className={`section-header ${isHeaderVisible ? 'animate-in' : ''}`}>
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions about our parking system</p>
        </div>

        <div className="faqs-content">
          {data.map((faq, index) => (
            <div
              key={faq.id || `faq-${index}`}
              ref={setItemRef(faq.id || `faq-${index}`)}
              data-faq-id={faq.id || `faq-${index}`}
              className={`faq-item ${visibleItems.has(faq.id || `faq-${index}`) ? 'animate-in' : ''} ${openItems.has(faq.id || `faq-${index}`) ? 'open' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <button
                className="faq-question"
                onClick={() => toggleFAQ(faq.id || `faq-${index}`)}
                aria-expanded={openItems.has(faq.id || `faq-${index}`)}
              >
                <span className="question-text">{faq.question}</span>
                <span className="expand-icon">
                  <svg
                    className={`chevron ${openItems.has(faq.id || `faq-${index}`) ? 'rotated' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>

              <div
                className={`faq-answer ${openItems.has(faq.id || `faq-${index}`) ? 'open' : ''}`}
              >
                <div className="answer-content">
                  <p>{faq.answer}</p>
                  <div className="faq-meta">
                    <span className="creator">Created by: {faq.creatorName}</span>
                    <span className="date">
                      {new Date(faq.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FAQsSection
