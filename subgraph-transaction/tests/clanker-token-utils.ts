import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Approval,
  CrosschainBurn,
  CrosschainMint,
  DelegateChanged,
  DelegateVotesChanged,
  EIP712DomainChanged,
  Transfer
} from "../generated/ClankerToken/ClankerToken"

export function createApprovalEvent(
  owner: Address,
  spender: Address,
  value: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("spender", ethereum.Value.fromAddress(spender))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return approvalEvent
}

export function createCrosschainBurnEvent(
  from: Address,
  amount: BigInt,
  sender: Address
): CrosschainBurn {
  let crosschainBurnEvent = changetype<CrosschainBurn>(newMockEvent())

  crosschainBurnEvent.parameters = new Array()

  crosschainBurnEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  crosschainBurnEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  crosschainBurnEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return crosschainBurnEvent
}

export function createCrosschainMintEvent(
  to: Address,
  amount: BigInt,
  sender: Address
): CrosschainMint {
  let crosschainMintEvent = changetype<CrosschainMint>(newMockEvent())

  crosschainMintEvent.parameters = new Array()

  crosschainMintEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  crosschainMintEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  crosschainMintEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return crosschainMintEvent
}

export function createDelegateChangedEvent(
  delegator: Address,
  fromDelegate: Address,
  toDelegate: Address
): DelegateChanged {
  let delegateChangedEvent = changetype<DelegateChanged>(newMockEvent())

  delegateChangedEvent.parameters = new Array()

  delegateChangedEvent.parameters.push(
    new ethereum.EventParam("delegator", ethereum.Value.fromAddress(delegator))
  )
  delegateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "fromDelegate",
      ethereum.Value.fromAddress(fromDelegate)
    )
  )
  delegateChangedEvent.parameters.push(
    new ethereum.EventParam(
      "toDelegate",
      ethereum.Value.fromAddress(toDelegate)
    )
  )

  return delegateChangedEvent
}

export function createDelegateVotesChangedEvent(
  delegate: Address,
  previousVotes: BigInt,
  newVotes: BigInt
): DelegateVotesChanged {
  let delegateVotesChangedEvent =
    changetype<DelegateVotesChanged>(newMockEvent())

  delegateVotesChangedEvent.parameters = new Array()

  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam("delegate", ethereum.Value.fromAddress(delegate))
  )
  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousVotes",
      ethereum.Value.fromUnsignedBigInt(previousVotes)
    )
  )
  delegateVotesChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newVotes",
      ethereum.Value.fromUnsignedBigInt(newVotes)
    )
  )

  return delegateVotesChangedEvent
}

export function createEIP712DomainChangedEvent(): EIP712DomainChanged {
  let eip712DomainChangedEvent = changetype<EIP712DomainChanged>(newMockEvent())

  eip712DomainChangedEvent.parameters = new Array()

  return eip712DomainChangedEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  value: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("value", ethereum.Value.fromUnsignedBigInt(value))
  )

  return transferEvent
}
