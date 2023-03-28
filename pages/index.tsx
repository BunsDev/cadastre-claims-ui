import Home from "../components/Home";
import Map, { STATE, GeoWebCoordinate } from "../components/Map";
import Profile from "../components/profile/Profile";
import FundsRaisedCounter from "../components/FundsRaisedCounter";
import { SafeAuthKit, SafeAuthProviderType } from "@safe-global/auth-kit";
import Safe from "@safe-global/safe-core-sdk";
import { GelatoRelayAdapter } from "@safe-global/relay-kit";
import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Navbar from "react-bootstrap/Navbar";

import {
  RPC_URLS,
  NETWORK_ID,
  CERAMIC_URL,
  IPFS_GATEWAY,
  IPFS_DELEGATE,
  WEB3AUTH_CLIENT_ID,
  RELAY_APP_API_KEY,
} from "../lib/constants";
import { GeoWebContent } from "@geo-web/content";
import { getContractsForChainOrThrow } from "@geo-web/sdk";
import { CeramicClient } from "@ceramicnetwork/http-client";

import { ethers, BigNumber } from "ethers";
import { Framework, NativeAssetSuperToken } from "@superfluid-finance/sdk-core";
import { setSignerForSdkRedux } from "@superfluid-finance/sdk-redux";
import { Contracts } from "@geo-web/sdk/dist/contract/types";

import { getIpfs, providers } from "ipfs-provider";
import type { IPFS } from "ipfs-core-types";
import * as IPFSCore from "ipfs-core";
import type { Point } from "@turf/turf";
import * as IPFSHttpClient from "ipfs-http-client";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { InvocationConfig } from "@web3-storage/upload-client";
import AddFundsModal from "../components/profile/AddFundsModal";
import NavMenu from "../components/nav/NavMenu";
import ConnectWallet from "../components/ConnectWallet";
import { getSigner } from "../lib/getSigner";

export interface SmartAccount {
  safeAuthKit: SafeAuthKit;
  relayAdapter: GelatoRelayAdapter;
  eoaAddress?: string;
  safe?: Safe;
  safeAddress?: string;
}

const { httpClient, jsIpfs } = providers;

function IndexPage() {
  const [registryContract, setRegistryContract] = React.useState<
    Contracts["registryDiamondContract"] | null
  >(null);
  const [ceramic, setCeramic] = React.useState<CeramicClient | null>(null);
  const [ipfs, setIpfs] = React.useState<IPFS | null>(null);
  const [paymentToken, setPaymentToken] = React.useState<
    NativeAssetSuperToken | undefined
  >(undefined);
  const [sfFramework, setSfFramework] = React.useState<Framework | undefined>(
    undefined
  );
  const [smartAccount, setSmartAccount] = React.useState<SmartAccount | null>(
    null
  );
  const [portfolioNeedActionCount, setPortfolioNeedActionCount] =
    React.useState(0);
  const [selectedParcelId, setSelectedParcelId] = React.useState("");
  const [interactionState, setInteractionState] = React.useState<STATE>(
    STATE.VIEWING
  );
  const [parcelNavigationCenter, setParcelNavigationCenter] =
    React.useState<Point | null>(null);
  const [shouldRefetchParcelsData, setShouldRefetchParcelsData] =
    React.useState(false);
  const [beneficiaryAddress, setBeneficiaryAddress] = React.useState("");
  const [auctionStart, setAuctionStart] = React.useState<BigNumber>(
    BigNumber.from(0)
  );
  const [auctionEnd, setAuctionEnd] = React.useState<BigNumber>(
    BigNumber.from(0)
  );
  const [startingBid, setStartingBid] = React.useState<BigNumber>(
    BigNumber.from(0)
  );
  const [endingBid, setEndingBid] = React.useState<BigNumber>(
    BigNumber.from(0)
  );
  const [geoWebContent, setGeoWebContent] =
    React.useState<GeoWebContent | null>(null);
  const [geoWebCoordinate, setGeoWebCoordinate] =
    React.useState<GeoWebCoordinate>();
  const [isFirstVisit, setIsFirstVisit] = React.useState<boolean>(false);
  const [w3InvocationConfig, setW3InvocationConfig] =
    React.useState<InvocationConfig>();
  const [showAddFundsModal, setShowAddFundsModal] =
    React.useState<boolean>(true);

  React.useEffect(() => {
    const start = async () => {
      const isFirstVisit = localStorage.getItem("gwCadastreAlreadyVisited")
        ? false
        : true;
      setIsFirstVisit(isFirstVisit);
      // eslint-disable-next-line import/no-unresolved
      import("as-geo-web-coordinate").then((geoWebCoordinate) => {
        setGeoWebCoordinate(geoWebCoordinate);
      });

      const lib = new ethers.providers.JsonRpcBatchProvider(
        RPC_URLS[NETWORK_ID],
        NETWORK_ID
      );

      const { registryDiamondContract } = getContractsForChainOrThrow(
        NETWORK_ID,
        lib
      );
      setRegistryContract(registryDiamondContract);

      const _beneficiaryAddress =
        await registryDiamondContract.getBeneficiary();

      setBeneficiaryAddress(_beneficiaryAddress);

      const [_auctionStart, _auctionEnd, _startingBid, _endingBid] =
        await Promise.all([
          registryDiamondContract.getAuctionStart(),
          registryDiamondContract.getAuctionEnd(),
          registryDiamondContract.getStartingBid(),
          registryDiamondContract.getEndingBid(),
        ]);

      if (!_auctionStart.isZero() || !_auctionEnd.isZero()) {
        setAuctionStart(_auctionStart);
        setAuctionEnd(_auctionEnd);
        setStartingBid(_startingBid);
        setEndingBid(_endingBid);
      }
      const ceramic = new CeramicClient(CERAMIC_URL);
      setCeramic(ceramic);

      const framework = await Framework.create({
        chainId: NETWORK_ID,
        provider: lib,
      });
      setSfFramework(framework);

      const superToken = await framework.loadNativeAssetSuperToken("ETHx");
      setPaymentToken(superToken);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSignerForSdkRedux(NETWORK_ID, async () => lib as any);

      const { ipfs, provider, apiAddress } = await getIpfs({
        providers: [
          httpClient({
            loadHttpClientModule: () => IPFSHttpClient,
            apiAddress: "/ip4/127.0.0.1/tcp/5001",
          }),
          httpClient({
            loadHttpClientModule: () => IPFSHttpClient,
            apiAddress: "/ip4/127.0.0.1/tcp/45005",
          }),
          jsIpfs({
            loadJsIpfsModule: () => IPFSCore,
            options: {
              config: {
                Addresses: {
                  Delegates: [IPFS_DELEGATE],
                },
              },
              preload: {
                enabled: false,
              },
            },
          }),
        ],
      });

      if (ipfs) {
        console.log("IPFS API is provided by: " + provider);
        if (provider === "httpClient") {
          console.log("HTTP API address: " + apiAddress);
        }
      }

      setIpfs(ipfs);

      const geoWebContent = new GeoWebContent({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ceramic: ceramic as any,
        ipfsGatewayHost: IPFS_GATEWAY,
        ipfs,
      });

      setGeoWebContent(geoWebContent);

      const relayAdapter = new GelatoRelayAdapter(RELAY_APP_API_KEY);
      const safeAuthKit = await SafeAuthKit.init(
        SafeAuthProviderType.Web3Auth,
        {
          chainId: `0x${NETWORK_ID.toString(16)}`,
          authProviderConfig: {
            rpcTarget: RPC_URLS[NETWORK_ID],
            clientId: WEB3AUTH_CLIENT_ID,
            network: process.env.APP_ENV === "mainnet" ? "mainnet" : "testnet",
            theme: "dark",
          },
        }
      );

      if (safeAuthKit && relayAdapter) {
        setSmartAccount({ safeAuthKit, relayAdapter });
      }
    };

    start();
  }, []);

  return (
    <>
      <Container fluid>
        <Navbar
          bg="dark"
          variant="dark"
          fixed="top"
          style={{ height: "100px" }}
          className="border-bottom border-purple border-opacity-25"
        >
          <Col className="ms-1 ps-3 ms-sm-4">
            <div
              className="d-flex align-items-center text-light"
              style={{
                fontSize: "2.5em",
                fontFamily: "Abel",
              }}
            >
              <Image
                style={{ height: "1.1em", marginRight: "10px" }}
                src="logo.png"
              />
              <span className="d-none d-sm-block fs-1">Cadastre</span>
              <span className="d-none d-sm-block fs-6 align-self-start">
                BETA
              </span>
            </div>
          </Col>
          <Col xs="6" sm="4">
            <FundsRaisedCounter beneficiaryAddress={beneficiaryAddress} />
          </Col>
          <Col className="d-flex justify-content-end align-items-center gap-3 pe-1 text-end">
            <div className="d-none d-sm-block">
              {smartAccount?.safeAddress &&
              sfFramework &&
              ceramic &&
              ipfs &&
              ceramic.did &&
              geoWebContent &&
              registryContract &&
              paymentToken ? (
                <Profile
                  smartAccount={smartAccount}
                  setSmartAccount={setSmartAccount}
                  account={smartAccount.safeAddress.toLowerCase() ?? ""}
                  signer={getSigner(smartAccount.safeAuthKit)}
                  sfFramework={sfFramework}
                  ceramic={ceramic}
                  setCeramic={setCeramic}
                  ipfs={ipfs}
                  setW3InvocationConfig={setW3InvocationConfig}
                  geoWebContent={geoWebContent}
                  setGeoWebContent={setGeoWebContent}
                  registryContract={registryContract}
                  paymentToken={paymentToken}
                  portfolioNeedActionCount={portfolioNeedActionCount}
                  setPortfolioNeedActionCount={setPortfolioNeedActionCount}
                  setSelectedParcelId={setSelectedParcelId}
                  interactionState={interactionState}
                  setInteractionState={setInteractionState}
                  setParcelNavigationCenter={setParcelNavigationCenter}
                  shouldRefetchParcelsData={shouldRefetchParcelsData}
                  setShouldRefetchParcelsData={setShouldRefetchParcelsData}
                />
              ) : (
                <ConnectWallet
                  variant="header"
                  ipfs={ipfs}
                  ceramic={ceramic}
                  setCeramic={setCeramic}
                  smartAccount={smartAccount}
                  setSmartAccount={setSmartAccount}
                  setGeoWebContent={setGeoWebContent}
                  setW3InvocationConfig={setW3InvocationConfig}
                />
              )}
            </div>
            <NavMenu />
          </Col>
        </Navbar>
      </Container>
      <Container fluid>
        {!isFirstVisit &&
        registryContract &&
        paymentToken &&
        ceramic &&
        ipfs &&
        geoWebContent &&
        geoWebCoordinate &&
        sfFramework ? (
          <Row>
            <Map
              registryContract={registryContract}
              smartAccount={smartAccount}
              setSmartAccount={setSmartAccount}
              account={smartAccount?.safeAddress ?? ""}
              signer={
                smartAccount?.eoaAddress
                  ? getSigner(smartAccount.safeAuthKit)
                  : null
              }
              ceramic={ceramic}
              setCeramic={setCeramic}
              ipfs={ipfs}
              geoWebContent={geoWebContent}
              setGeoWebContent={setGeoWebContent}
              w3InvocationConfig={w3InvocationConfig}
              setW3InvocationConfig={setW3InvocationConfig}
              geoWebCoordinate={geoWebCoordinate}
              paymentToken={paymentToken}
              sfFramework={sfFramework}
              setPortfolioNeedActionCount={setPortfolioNeedActionCount}
              selectedParcelId={selectedParcelId}
              setSelectedParcelId={setSelectedParcelId}
              interactionState={interactionState}
              setInteractionState={setInteractionState}
              parcelNavigationCenter={parcelNavigationCenter}
              shouldRefetchParcelsData={shouldRefetchParcelsData}
              setParcelNavigationCenter={setParcelNavigationCenter}
              setShouldRefetchParcelsData={setShouldRefetchParcelsData}
              auctionStart={auctionStart}
              auctionEnd={auctionEnd}
              startingBid={startingBid}
              endingBid={endingBid}
            ></Map>
          </Row>
        ) : (
          <Home
            signer={
              smartAccount?.eoaAddress
                ? getSigner(smartAccount.safeAuthKit)
                : null
            }
            ceramic={ceramic}
            isFirstVisit={isFirstVisit}
            setIsFirstVisit={setIsFirstVisit}
          />
        )}
        {smartAccount?.safeAddress && !smartAccount.safe && paymentToken && (
          <AddFundsModal
            show={showAddFundsModal}
            handleClose={() => setShowAddFundsModal(false)}
            paymentToken={paymentToken}
            smartAccount={smartAccount}
            setSmartAccount={setSmartAccount}
          />
        )}
      </Container>
    </>
  );
}

export default IndexPage;
