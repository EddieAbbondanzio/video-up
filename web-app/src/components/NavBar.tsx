import React from "react";
import logo from "../../static/images/logo-white.png";
import styled from "styled-components";

export function NavBar() {
  const goHome = () => {
    window.location.replace("/");
  };

  return (
    <div className="navbar is-success is-justify-content-center">
      <Brand className="navbar-item">
        <LogoWrapper onClick={goHome}>
          <img src={logo} />
        </LogoWrapper>
      </Brand>
    </div>
  );
}

const Brand = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LogoWrapper = styled.a`
  display: flex;
  height: 28px;
  width: 133px;
`;
