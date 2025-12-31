## Technical Specification: Shielded State Middleware (SSM)

### 1. Architectural Overview

The SSM acts as an abstraction layer between the Solana Virtual Machine (SVM) and the **Light Protocol ZK Stack**. It manages the transition of data from "Public On-chain State" to "Compressed Private State" using Sparse Binary Merkle Trees.

### 2. Core Components

#### A. The State Layer (Compressed Accounts)

Unlike standard Solana accounts, data is stored in the **Ledger Space**.

* **Account Structure:** * `Owner`: The public key authorized to spend/modify the state.
* `Data Hash`: A Poseidon hash of the account's internal state.
* `Salt`: A 32-byte value to ensure entropy and prevent rainbow table attacks on hashes.


* **Merkle Tree:** A sparse tree where each leaf is a hash of a compressed account.

#### B. The Proving System (zk.js & Groth16)

The middleware must generate ZK-SNARKs on the client side to prove:

1. **Membership:** "The account I am modifying exists in the current State Root."
2. **Authorization:** "I possess the private key corresponding to the `Owner` field of this compressed account."
3. **Integrity:** "The new state root is calculated correctly based on the defined program logic."

#### C. The Infrastructure (Foresters & RPC)

* **Photon RPC:** Specialized RPC nodes provided by Helius to index and fetch compressed state.
* **Forester Node:** A background worker that monitors the **Address Queue** and **Nullifier Queue** to finalize state transitions.

---

### 3. Data Flow & Transaction Lifecycle

1. **Input:** User initiates a transaction (e.g., "Send 10 tokens privately").
2. **State Fetching:** The SSM queries the **Photon API** to retrieve the Merkle Proof for the user's compressed account.
3. **Circuit Execution:** The client-side ZK circuit (compiled via `zk.js`) takes the Merkle Proof, private keys, and transaction details to generate a **Groth16 Proof**.
4. **Compression:** The original account is "nullified" (added to the Nullifier Queue), and a new compressed account with the updated balance is created.
5. **Submission:** A single Solana transaction is sent containing the 128-byte ZK proof and the new State Root.
6. **Verification:** The on-chain Light Protocol program verifies the proof in ~$O(1)$$ time.

---

### 4. Database & State Schema (Solopreneur Friendly)

To maintain high performance without a massive server, the SSM utilizes a **Hybrid Indexing Strategy**:

| Layer | Technology | Purpose |
| --- | --- | --- |
| **On-chain** | Solana Ledger | Immutable storage of compressed hashes. |
| **Off-chain Index** | Photon (Helius) | Tracking current Merkle Roots and leaf validity. |
| **Client-side** | IndexedDB / LocalStorage | Storing encrypted "Viewing Keys" so users can see their own private history. |

---

### 5. Implementation Roadmap (Technical Milestones)

#### Milestone 1: Environment Parity

* Deploy a local validator with the Light Protocol testnet program.
* Configure **`zk-sdk`** and verify the ability to create a "compressed zero-balance account."

#### Milestone 2: Circuit Customization

* Modify the standard transfer circuit to include a **"Compliance Metadata"** field.
* Implement Poseidon hashing for custom state objects (e.g., `EmployeeRecord` or `VoteBallot`).

#### Milestone 3: The "Forester" Bot

* Write a Rust-based bot that monitors the `AddressQueue` account on-chain.
* Automate the `flush` instruction to ensure the Merkle Tree is updated every N slots.

---

### 6. Security & Constraints

* **Transaction Limit:** Ensure the total ZK proof + account inputs do not exceed **1232 bytes**.
* **Proof Generation Time:** Optimize the WASM-based prover to ensure mobile users don't wait more than **3-5 seconds** for a proof.
* **Nullifier Collision:** Use a unique seed for nullifiers to prevent "spent" states from being re-used across different protocol versions.
