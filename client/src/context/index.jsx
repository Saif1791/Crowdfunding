import React, { useContext, createContext } from "react";
import { ethers } from "ethers";
import { useAddress, useMetamask } from "@thirdweb-dev/react";
import contractABI from "../abi/contractABI.json"; // Import the ABI JSON

const StateContext = createContext();

const CONTRACT_ADDRESS = "0xb8906448b7f618C032E57BD8Ea3a008717C9662F";

export const StateContextProvider = ({ children }) => {
  const address = useAddress();
  const connect = useMetamask();

  const getContract = () => {
    if (!address) {
      // throw new Error("Wallet is not connected");
      alert("Wallet is not connected");
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
  };

  const publishCampaign = async (form) => {
    try {
      const contract = getContract();
      const transaction = await contract.createCampaign(
        address,
        form.title,
        form.description,
        form.target,
        new Date(form.deadline).getTime(),
        form.image
      );
      await transaction.wait();
      console.log("Campaign created successfully");
    } catch (error) {
      console.error("Failed to create campaign:", error);
    }
  };

  const getCampaigns = async () => {
    try {
      const contract = getContract();
      const campaigns = await contract.getCampaigns();
      return campaigns.map((campaign, i) => ({
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(
          campaign.amountCollected.toString()
        ),
        image: campaign.image,
        pId: i,
      }));
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    }
  };

  // Other functions (donate, getDonations, etc.)
  const donate = async (pId, amount) => {
    try {
      const transaction = await contract.donateToCampaign(pId, {
        value: ethers.utils.parseEther(amount),
      });
      await transaction.wait();
      console.log("Donation successful");
    } catch (error) {
      console.error("Failed to donate:", error);
    }
  };

  const getDonations = async (pId) => {
    try {
      const donations = await contract.getDonators(pId);
      const numberOfDonations = donations[0].length;
      return donations[0].map((donator, i) => ({
        donator,
        donation: ethers.utils.formatEther(donations[1][i].toString()),
      }));
    } catch (error) {
      console.error("Failed to fetch donations:", error);
    }
  };

  return (
    <StateContext.Provider
      value={{
        address,
        connect,
        createCampaign: publishCampaign,
        getCampaigns,
        donate,
        getDonations,
      }}
    >
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = () => useContext(StateContext);
