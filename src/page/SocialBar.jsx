import React from 'react';
import './SocialBar.css';

export default function SocialBar() {
  return (
    <div className="social-bar-wrapper">
      <ul>
        <li>
          <a href="#">
            <i className="fa fa-facebook" aria-hidden="true"></i>
            <span>Facebook</span>
          </a>
        </li>
        <li>
          <a href="#">
            <i className="fa fa-twitter" aria-hidden="true"></i>
            <span>Twitter</span>
          </a>
        </li>
        <li>
          <a href="#">
            <i className="fa fa-youtube-play" aria-hidden="true"></i>
            <span>YouTube</span>
          </a>
        </li>
        <li>
          <a href="#">
            <i className="fa fa-instagram" aria-hidden="true"></i>
            <span>Instagram</span>
          </a>
        </li>
      </ul>
    </div>
  );
}