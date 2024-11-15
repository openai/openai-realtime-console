/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * REACT_APP_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.REACT_APP_LOCAL_RELAY_SERVER_URL || '';

import { useEffect, useRef, useCallback, useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { RealtimeClient } from '@openai/realtime-api-beta';
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js';
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js';
import { instructions } from '../utils/storytimestacy_config.js';
import { WavRenderer } from '../utils/wav_renderer';

import { X, Edit, Zap, ArrowUp, ArrowDown } from 'react-feather';
import { Button } from '../components/button/Button';
import { Toggle } from '../components/toggle/Toggle';


import './ConsolePage.scss';
import { isJsxOpeningLikeElement } from 'typescript';

export function ConsolePage() {
  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = LOCAL_RELAY_SERVER_URL
    ? ''
    : localStorage.getItem('tmp::voice_api_key') ||
      prompt('OpenAI API Key') ||
      '';
  if (apiKey !== '') {
    localStorage.setItem('tmp::voice_api_key', apiKey);
  }

  /**
   * When you click the API key
   */
  const resetAPIKey = useCallback(() => {
    const apiKey = prompt('OpenAI API Key');
    if (apiKey !== null) {
      localStorage.clear();
      localStorage.setItem('tmp::voice_api_key', apiKey);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Load the Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-6JJNNQ1LLT';
    document.head.appendChild(script);

    // Initialize Google Analytics after the script loads
    script.onload = () => {
      // @ts-ignore
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        // @ts-ignore
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', 'G-6JJNNQ1LLT');
    };
  }, []);

  /**
   * Render the application
   */
  return (
    <div data-component="ConsolePage">
    
      <div className="content-top">
        <div className="content-api-key">
          {!LOCAL_RELAY_SERVER_URL && (
            <Button
              icon={Edit}
              iconPosition="end"
              buttonStyle="flush"
              label={`api key: ${apiKey.slice(0, 3)}...`}
              onClick={() => resetAPIKey()}
            />
          )}
        </div>
      </div>

      <div className="title-page">
        <div className="content-title">
          <div className="content-title">
            <img src="/ollie.png" className="ollie-image" alt="Ollie" />
            <h1 className="rainbow-text">Oliver's Magical Friends</h1>
          </div>
        </div>
        
        <div className="image-links">
          <div className="image-container">
            <Link to="/storytimestacy">
              <img src="/storytime_stacy.png" alt="Storytime Stacy" />
            </Link>
            <p className="caption">Storytime Stacy</p>
          </div>

          <div className="image-container">
            <Link to="/comradecharlie">
             <img src="/comrade_charlie.png" alt="Comrade Charlie" />
            </Link>
           <p className="caption">Comrade Charlie</p>
          </div>

          <div className="image-container">
            <Link to="/buddyboba">
             <img src="/buddy_boba.png" alt="Buddy Boba" />
           </Link>
            <p className="caption">Buddy Boba</p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>
          Disclaimer: This website is created for learning purposes only. The information provided here should not be considered professional advice. Please note that we make no guarantees regarding the accuracy, completeness, or reliability of the contents of this website. Any actions you take based on the contents of this website are at your own risk. We are not liable for any losses or damages incurred from the use of this website.
        </p>
      </footer>
    </div>

  );
}
