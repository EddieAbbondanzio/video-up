import logo from "../../static/images/logo-white.png";
import styled from "styled-components";

export function NavBar() {
  return (
    <CenteredNav className="navbar is-success">
      <div className="navbar-item">
        <LogoWrapper>
          <img src={logo} />
        </LogoWrapper>
      </div>
    </CenteredNav>
  );
}

const CenteredNav = styled.nav`
  justify-content: center;
`;

const LogoWrapper = styled.div`
  display: flex;
`;
