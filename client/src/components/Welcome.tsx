import styled from "styled-components";
import stockPhoto from "../../static/images/stock-photo.png";

export function Welcome(): JSX.Element {
  return (
    <div className="m-4 is-flex is-flex-grow-1">
      <div className="is-flex-tablet is-flex-direction-row">
        <Column className="is-justify-content-center">
          <CallToAction>
            <h1 className="title is-size-3-mobile is-size-2-tablet">
              Live video meets for anyone
            </h1>
            <p className="subtitle is-size-6-mobile is-size-4-tablet">
              Free to use P2P video meets that can be instantly joined via a
              magic link for up to 4 participants.
            </p>
            <button className="button is-primary is-medium">
              Host a video meet
            </button>
          </CallToAction>
        </Column>
        <Column>
          <div>
            <img src={stockPhoto} />
          </div>
        </Column>
      </div>
    </div>
  );
}

const Column = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const CallToAction = styled.div`
  max-width: 80%;
`;
