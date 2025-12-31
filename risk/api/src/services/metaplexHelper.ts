import { Connection, PublicKey } from '@solana/web3.js';
import { TokenMetadata } from '../types/data';

/**
 * Helper functions for querying Metaplex Token Metadata Program
 */
export class MetaplexHelper {
  private static readonly TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );

  /**
   * Derive the metadata PDA (Program Derived Address) for a token mint
   */
  static async getMetadataPDA(mint: PublicKey): Promise<PublicKey> {
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        this.TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      this.TOKEN_METADATA_PROGRAM_ID
    );
    return metadataPDA;
  }

  /**
   * Fetch token metadata from Metaplex Token Metadata Program
   */
  static async fetchTokenMetadata(
    connection: Connection,
    mint: PublicKey
  ): Promise<TokenMetadata | null> {
    try {
      const metadataPDA = await this.getMetadataPDA(mint);
      const accountInfo = await connection.getAccountInfo(metadataPDA);

      if (!accountInfo) {
        return null;
      }

      // Parse the metadata account data
      // Metaplex Token Metadata account structure:
      // - key: u8 (1 byte)
      // - update_authority: Pubkey (32 bytes)
      // - mint: Pubkey (32 bytes)
      // - data: MetadataData (variable)
      //   - name: String (4 bytes + string)
      //   - symbol: String (4 bytes + string)
      //   - uri: String (4 bytes + string)
      //   - seller_fee_basis_points: u16 (2 bytes)
      //   - creators: Option<Vec<Creator>> (variable)

      const data = accountInfo.data;
      let offset = 1; // Skip key byte

      // Skip update_authority (32 bytes)
      offset += 32;
      // Skip mint (32 bytes)
      offset += 32;

      // Read data section
      // Name (String)
      const nameLength = data.readUInt32LE(offset);
      offset += 4;
      const name = data.slice(offset, offset + nameLength).toString('utf8').replace(/\0/g, '');
      offset += nameLength;

      // Symbol (String)
      const symbolLength = data.readUInt32LE(offset);
      offset += 4;
      const symbol = data.slice(offset, offset + symbolLength).toString('utf8').replace(/\0/g, '');
      offset += symbolLength;

      // URI (String)
      const uriLength = data.readUInt32LE(offset);
      offset += 4;
      const uri = data.slice(offset, offset + uriLength).toString('utf8').replace(/\0/g, '');

      // Try to fetch additional metadata from URI if available
      let image: string | undefined;
      let description: string | undefined;

      if (uri) {
        try {
          const metadataResponse = await fetch(uri);
          if (metadataResponse.ok) {
            const metadataJson = await metadataResponse.json();
            image = metadataJson.image;
            description = metadataJson.description;
          }
        } catch (error) {
          // Failed to fetch URI metadata, continue without it
          console.warn(`Could not fetch metadata URI for ${mint.toBase58()}:`, error);
        }
      }

      return {
        name: name || undefined,
        symbol: symbol || undefined,
        uri: uri || undefined,
        image,
        description,
      };
    } catch (error) {
      console.warn(`Error fetching Metaplex metadata for ${mint.toBase58()}:`, error);
      return null;
    }
  }
}

