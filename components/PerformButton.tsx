import { ethers, BigNumber } from "ethers";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { SidebarProps } from "./Sidebar";
import { NETWORK_ID, GAS_BUFFER } from "../lib/constants";
import {
  getEncodedSafeTransaction,
  getMultiSendTransactionData,
  waitRelayedTxConfirmation,
} from "../lib/safeTransaction";

export type PerformButtonProps = SidebarProps & {
  isDisabled: boolean;
  requiredPayment: BigNumber | null;
  requiredFlowAmount: BigNumber | null;
  requiredFlowPermissions: number | null;
  spender: string | null;
  flowOperator: string | null;
  setErrorMessage: (v: string) => void;
  isActing: boolean;
  setIsActing: (v: boolean) => void;
  setDidFail: (v: boolean) => void;
  encodeFunctionData: () => string | void;
  callback: (
    receipt?: ethers.providers.TransactionReceipt
  ) => Promise<string | void>;
  buttonText: string;
};

export function PerformButton(props: PerformButtonProps) {
  const {
    isDisabled,
    paymentToken,
    smartAccount,
    spender,
    requiredPayment,
    sfFramework,
    requiredFlowPermissions,
    requiredFlowAmount,
    flowOperator,
    setErrorMessage,
    isActing,
    setIsActing,
    setDidFail,
    encodeFunctionData,
    callback,
    buttonText,
  } = props;

  const { provider } = sfFramework.settings;

  const isReady =
    requiredPayment &&
    requiredFlowAmount &&
    requiredFlowPermissions &&
    spender &&
    flowOperator
      ? true
      : false;

  const spinner = (
    <Spinner as="span" size="sm" animation="border" role="status">
      <span className="visually-hidden">Sending Transaction...</span>
    </Spinner>
  );

  const submit = async () => {
    try {
      if (
        !flowOperator ||
        !requiredFlowAmount ||
        !spender ||
        !requiredPayment ||
        !smartAccount?.safe ||
        !smartAccount?.safeAddress
      ) {
        throw new Error("Missing props");
      }

      setIsActing(true);

      const safeGasLimit = BigNumber.from("12000000");
      const relayGasLimit = BigNumber.from("15000000");
      const ethBalance = await smartAccount.safe.getBalance();
      const gasBufferedBalance = ethBalance.sub(
        ethers.utils.parseEther(GAS_BUFFER)
      );
      const yearlyFeeBufferedPayment = requiredPayment.add(requiredFlowAmount);
      const wrapAmount = gasBufferedBalance.lt(yearlyFeeBufferedPayment)
        ? gasBufferedBalance.toString()
        : yearlyFeeBufferedPayment.toString();
      const wrap = await paymentToken.upgrade({
        amount: wrapAmount,
      }).populateTransactionPromise;
      const approveSpending = await paymentToken.approve({
        amount: requiredPayment.toString(),
        receiver: spender,
      }).populateTransactionPromise;
      const approveFlow = await sfFramework.cfaV1.updateFlowOperatorPermissions(
        {
          flowOperator: flowOperator,
          permissions: 3, // Create or update
          flowRateAllowance: requiredFlowAmount.toString(),
          superToken: paymentToken.address,
        }
      ).populateTransactionPromise;

      if (
        !approveSpending.to ||
        !approveSpending.data ||
        !approveFlow.to ||
        !approveFlow.data ||
        !wrap.to ||
        !wrap.data
      ) {
        throw new Error("Error populating Superfluid transaction");
      }

      const encodedGwContractFunctionData = encodeFunctionData();

      /* Offchain content change only */
      if (!encodedGwContractFunctionData) {
        return;
      }

      const wrapTransactionData = {
        data: wrap.data,
        to: wrap.to,
        value: wrapAmount,
      };
      const approveSpendingTransactionData = {
        data: approveSpending.data,
        to: approveSpending.to,
        value: "0",
      };
      const approveFlowTransactionData = {
        data: approveFlow.data,
        to: approveFlow.to,
        value: "0",
      };
      const gwContractTransactionData = {
        data: encodedGwContractFunctionData,
        to: spender,
        value: "0",
      };
      const encodedMultiSendTransaction = getMultiSendTransactionData(
        smartAccount,
        [
          wrapTransactionData,
          approveSpendingTransactionData,
          approveFlowTransactionData,
          gwContractTransactionData,
        ]
      );
      const encodedMultiSendData = await getEncodedSafeTransaction(
        smartAccount,
        encodedMultiSendTransaction,
        safeGasLimit
      );
      const res = await smartAccount.relayAdapter.relayTransaction({
        target: smartAccount.safeAddress,
        encodedTransaction: encodedMultiSendData,
        chainId: NETWORK_ID,
        options: {
          gasToken: ethers.constants.AddressZero,
          gasLimit: relayGasLimit,
        },
      });

      const receipt = await waitRelayedTxConfirmation(
        smartAccount,
        provider,
        res.taskId
      );
      await callback(receipt);
      setIsActing(false);
    } catch (err) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      console.error(err);
      setErrorMessage(
        (err as any).reason
          ? (err as any).reason.replace("execution reverted: ", "")
          : (err as Error).message
      );
      setIsActing(false);
      setDidFail(true);

      return false;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  };

  return (
    <Button
      variant={buttonText === "Reject Bid" ? "danger" : "success"}
      className="w-100"
      onClick={() => submit()}
      disabled={isDisabled || !isReady}
    >
      {isActing ? spinner : buttonText}
    </Button>
  );
}

export default PerformButton;
