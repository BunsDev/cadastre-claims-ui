import React from "react";
import Image from "react-bootstrap/Image";
import NavDropdown from "react-bootstrap/NavDropdown";
import FAQ from "../FAQ";
import OnRampWidget from "../OnRampWidget";

export default function NavMenu({ account }: { account?: string }) {
  if (process.env.NEXT_PUBLIC_APP_ENV === "mainnet") {
    return <NavMenuMainnet account={account} />;
  } else {
    return <NavMenuTestnet account={account} />;
  }
}

function NavMenuMainnet({ account }: { account?: string }) {
  return (
    <NavDropdown
      title={<Image src="more-menu.svg" alt="more-menu" width={36} />}
      id="collasible-nav-dropdown"
      menuVariant="dark"
      align="end"
    >
      <NavDropdown.Item>
        <FAQ />
      </NavDropdown.Item>
      <NavDropdown.Item className="d-flex gap-2">
        <OnRampWidget target={<span>Buy ETH</span>} accountAddress={account} />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://docs.geoweb.network/"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Documentation
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://testnet.geoweb.land/"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Cadastre Testnet
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://www.geoweb.network/terms"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Terms of Service
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://www.geoweb.network/privacy"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Privacy Policy
      </NavDropdown.Item>
      <SocialItems />
    </NavDropdown>
  );
}

function NavMenuTestnet({ account }: { account?: string }) {
  return (
    <NavDropdown
      title={<Image src="more-menu.svg" alt="more-menu" width={36} />}
      id="collasible-nav-dropdown"
      menuVariant="dark"
      align="end"
    >
      <NavDropdown.Item>
        <FAQ />
      </NavDropdown.Item>
      <NavDropdown.Item>
        <OnRampWidget target={<span>Buy ETH</span>} accountAddress={account} />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://optimismfaucet.xyz/"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Request Testnet ETH
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://docs.geoweb.network/"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Documentation
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://geoweb.land/"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Cadastre Mainnet
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://www.geoweb.network/terms"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Terms of Service
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://www.geoweb.network/privacy"
        target="_blank"
        rel="noopener"
        className="d-flex gap-2"
      >
        Privacy Policy
      </NavDropdown.Item>
      <SocialItems />
    </NavDropdown>
  );
}

function SocialItems() {
  return (
    <div className="d-flex align-items-center">
      <NavDropdown.Item
        href="https://discord.com/invite/reXgPru7ck"
        target="_blank"
        rel="noopener"
        bsPrefix="none"
        style={{ width: "48px", margin: "4px 0 0 16px" }}
      >
        <Image src="discord.svg" alt="discord" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://twitter.com/thegeoweb"
        target="_blank"
        rel="noopener"
        bsPrefix="none"
        style={{ width: "48px", margin: "4px 0 0 0" }}
      >
        <Image src="twitter.svg" alt="twitter" />
      </NavDropdown.Item>
      <NavDropdown.Item
        href="https://github.com/Geo-Web-Project"
        target="_blank"
        rel="noopener"
        bsPrefix="none"
        style={{ width: "48px", margin: "4px 0 0 0" }}
      >
        <Image src="github.svg" alt="github" />
      </NavDropdown.Item>
    </div>
  );
}
