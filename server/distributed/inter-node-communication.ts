/**
 * Secure Inter-Node Communication for Distributed Consciousness
 * Handles encrypted communication, authentication, and message routing between nodes
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server } from 'http';
import { ConsciousnessNode, DistributedNodeRegistry } from './node-registry';
import crypto from 'crypto';

export interface NodeMessage {
  id: string;
  type: 'consciousness-sync' | 'health-check' | 'consensus-vote' | 'state-update' | 'query-request' | 'query-response' | 'auth-response';
  fromNodeId: string;
  toNodeId: string;
  payload: any;
  timestamp: Date;
  signature: string;
  encrypted: boolean;
}

export interface ConnectionInfo {
  nodeId: string;
  socket: WebSocket;
  authenticated: boolean;
  lastSeen: Date;
  messageCount: number;
}

export class InterNodeCommunication extends EventEmitter {
  private nodeRegistry: DistributedNodeRegistry;
  private wsServer: WebSocketServer | null = null;
  private httpServer: Server | null = null;
  private connections: Map<string, ConnectionInfo> = new Map();
  private nodeId: string;
  private port: number;
  private privateKey: string;
  private publicKey: string;
  private nodeSecrets: Map<string, string> = new Map(); // Node ID -> Shared Secret

  constructor(nodeRegistry: DistributedNodeRegistry, nodeId: string, port: number) {
    super();
    this.nodeRegistry = nodeRegistry;
    this.nodeId = nodeId;
    this.port = port;
    
    // Generate node keypair for secure communication
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.privateKey = privateKey;
    this.publicKey = publicKey;
    
    console.log(`🔐 Inter-node communication initialized for ${nodeId} on port ${port}`);
  }

  /**
   * Start the inter-node communication server
   */
  async startServer(): Promise<void> {
    this.httpServer = createServer();
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/consciousness-network',
      verifyClient: (info: any) => {
        // Basic verification - in production, add proper authentication
        return true;
      }
    });

    this.wsServer.on('connection', (socket, request) => {
      this.handleNewConnection(socket, request);
    });

    return new Promise((resolve, reject) => {
      this.httpServer!.listen(this.port, (error?: Error) => {
        if (error) {
          console.error(`❌ Failed to start inter-node server on port ${this.port}:`, error);
          reject(error);
        } else {
          console.log(`🌐 Inter-node communication server listening on port ${this.port}`);
          resolve();
        }
      });
    });
  }

  /**
   * Handle new incoming connection from another node
   */
  private handleNewConnection(socket: WebSocket, request: any): void {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const connectionInfo: ConnectionInfo = {
      nodeId: tempId, // Will be updated after authentication
      socket,
      authenticated: false,
      lastSeen: new Date(),
      messageCount: 0
    };

    console.log(`🔗 New inter-node connection attempt: ${tempId}`);

    socket.on('message', (data: Buffer) => {
      this.handleIncomingMessage(connectionInfo, data);
    });

    socket.on('close', () => {
      this.handleConnectionClosed(connectionInfo);
    });

    socket.on('error', (error) => {
      console.error(`❌ WebSocket error for ${connectionInfo.nodeId}:`, error);
      this.handleConnectionClosed(connectionInfo);
    });

    // Send authentication challenge
    this.sendAuthenticationChallenge(socket);
  }

  /**
   * Handle incoming message from another node
   */
  private async handleIncomingMessage(connection: ConnectionInfo, data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as NodeMessage;
      
      // Verify message signature
      if (!await this.verifyMessageSignature(message)) {
        console.warn(`⚠️  Invalid message signature from ${connection.nodeId}`);
        return;
      }

      connection.lastSeen = new Date();
      connection.messageCount++;

      // Handle authentication messages
      if (message.type === 'auth-response' && !connection.authenticated) {
        await this.handleAuthenticationResponse(connection, message);
        return;
      }

      // Require authentication for all other messages
      if (!connection.authenticated) {
        console.warn(`⚠️  Unauthenticated message from ${connection.nodeId}`);
        return;
      }

      // Decrypt message if needed
      let payload = message.payload;
      if (message.encrypted) {
        payload = await this.decryptPayload(message.payload, connection.nodeId);
      }

      console.log(`📨 Received ${message.type} from ${message.fromNodeId}`);

      // Emit message for handling by other components
      this.emit('node-message', {
        ...message,
        payload
      });

      // Handle specific message types
      switch (message.type) {
        case 'health-check':
          await this.handleHealthCheck(connection, message);
          break;
        case 'consciousness-sync':
          this.emit('consciousness-sync', message.payload);
          break;
        case 'consensus-vote':
          this.emit('consensus-vote', message.payload);
          break;
        case 'state-update':
          this.emit('distributed-state-update', message.payload);
          break;
        case 'query-request':
          await this.handleQueryRequest(connection, message);
          break;
      }

    } catch (error) {
      console.error(`❌ Error handling message from ${connection.nodeId}:`, error);
    }
  }

  /**
   * Send authentication challenge to new connection
   */
  private sendAuthenticationChallenge(socket: WebSocket): void {
    const challenge = crypto.randomBytes(32).toString('hex');
    const message: NodeMessage = {
      id: this.generateMessageId(),
      type: 'auth-challenge' as any,
      fromNodeId: this.nodeId,
      toNodeId: 'unknown',
      payload: {
        challenge,
        publicKey: this.publicKey,
        timestamp: new Date()
      },
      timestamp: new Date(),
      signature: '',
      encrypted: false
    };

    message.signature = this.signMessage(message);
    socket.send(JSON.stringify(message));
  }

  /**
   * Handle authentication response from connecting node
   */
  private async handleAuthenticationResponse(connection: ConnectionInfo, message: NodeMessage): Promise<void> {
    try {
      const { nodeId, challengeResponse, publicKey } = message.payload;
      
      // Verify the node exists in registry
      const node = this.nodeRegistry.getNode(nodeId);
      if (!node) {
        console.warn(`⚠️  Authentication failed: Unknown node ${nodeId}`);
        connection.socket.close();
        return;
      }

      // Verify challenge response (simplified - in production, use proper crypto)
      // For now, accept if node is in registry and response looks valid
      if (challengeResponse && publicKey) {
        connection.nodeId = nodeId;
        connection.authenticated = true;
        this.connections.set(nodeId, connection);
        
        // Store shared secret for encrypted communication
        const sharedSecret = crypto.randomBytes(32).toString('hex');
        this.nodeSecrets.set(nodeId, sharedSecret);
        
        console.log(`✅ Node authenticated: ${nodeId}`);
        
        // Send authentication success with shared secret
        await this.sendMessage(nodeId, 'auth-success' as any, {
          success: true,
          sharedSecret: this.encryptWithPublicKey(sharedSecret, publicKey)
        });
        
        this.emit('node-authenticated', nodeId);
      } else {
        console.warn(`⚠️  Authentication failed for node ${nodeId}: Invalid response`);
        connection.socket.close();
      }

    } catch (error) {
      console.error(`❌ Authentication error:`, error);
      connection.socket.close();
    }
  }

  /**
   * Connect to another consciousness node
   */
  async connectToNode(targetNode: ConsciousnessNode): Promise<boolean> {
    if (this.connections.has(targetNode.id)) {
      console.log(`🔗 Already connected to node: ${targetNode.id}`);
      return true;
    }

    try {
      const wsUrl = `ws://${targetNode.address}:${targetNode.port}/consciousness-network`;
      const socket = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          socket.close();
          reject(new Error('Connection timeout'));
        }, 10000);

        socket.on('open', () => {
          clearTimeout(timeout);
          console.log(`🌐 Connected to node: ${targetNode.id} at ${wsUrl}`);
          
          const connectionInfo: ConnectionInfo = {
            nodeId: targetNode.id,
            socket,
            authenticated: false,
            lastSeen: new Date(),
            messageCount: 0
          };

          socket.on('message', (data: Buffer) => {
            this.handleIncomingMessage(connectionInfo, data);
          });

          socket.on('close', () => {
            this.handleConnectionClosed(connectionInfo);
          });

          resolve(true);
        });

        socket.on('error', (error) => {
          clearTimeout(timeout);
          console.error(`❌ Failed to connect to node ${targetNode.id}:`, error);
          reject(error);
        });
      });

    } catch (error) {
      console.error(`❌ Error connecting to node ${targetNode.id}:`, error);
      return false;
    }
  }

  /**
   * Send message to a specific node
   */
  async sendMessage(targetNodeId: string, type: NodeMessage['type'], payload: any, encrypted: boolean = false): Promise<void> {
    const connection = this.connections.get(targetNodeId);
    if (!connection || !connection.authenticated) {
      console.warn(`⚠️  Cannot send message to ${targetNodeId}: Not connected or authenticated`);
      return;
    }

    let messagePayload = payload;
    if (encrypted) {
      messagePayload = await this.encryptPayload(payload, targetNodeId);
    }

    const message: NodeMessage = {
      id: this.generateMessageId(),
      type,
      fromNodeId: this.nodeId,
      toNodeId: targetNodeId,
      payload: messagePayload,
      timestamp: new Date(),
      signature: '',
      encrypted
    };

    message.signature = this.signMessage(message);
    
    try {
      connection.socket.send(JSON.stringify(message));
      console.log(`📤 Sent ${type} to ${targetNodeId}`);
    } catch (error) {
      console.error(`❌ Failed to send message to ${targetNodeId}:`, error);
    }
  }

  /**
   * Broadcast message to all connected nodes
   */
  async broadcastMessage(type: NodeMessage['type'], payload: any, encrypted: boolean = false): Promise<void> {
    const authenticatedConnections = Array.from(this.connections.values())
      .filter(conn => conn.authenticated);

    console.log(`📡 Broadcasting ${type} to ${authenticatedConnections.length} nodes`);

    for (const connection of authenticatedConnections) {
      await this.sendMessage(connection.nodeId, type, payload, encrypted);
    }
  }

  /**
   * Handle health check from another node
   */
  private async handleHealthCheck(connection: ConnectionInfo, message: NodeMessage): Promise<void> {
    // Respond with our health status
    await this.sendMessage(connection.nodeId, 'health-response' as any, {
      nodeId: this.nodeId,
      status: 'healthy',
      load: 0.5, // TODO: Get actual system load
      timestamp: new Date()
    });
  }

  /**
   * Handle query request from another node
   */
  private async handleQueryRequest(connection: ConnectionInfo, message: NodeMessage): Promise<void> {
    try {
      // Forward query to local AI system
      this.emit('remote-query', {
        requestId: message.id,
        fromNodeId: message.fromNodeId,
        query: message.payload.query,
        respondTo: (response: any) => {
          this.sendMessage(connection.nodeId, 'query-response', {
            requestId: message.id,
            response
          });
        }
      });
    } catch (error) {
      console.error(`❌ Error handling query request:`, error);
      await this.sendMessage(connection.nodeId, 'query-response', {
        requestId: message.id,
        error: 'Query processing failed'
      });
    }
  }

  /**
   * Handle connection closed
   */
  private handleConnectionClosed(connection: ConnectionInfo): void {
    if (connection.authenticated) {
      this.connections.delete(connection.nodeId);
      this.nodeSecrets.delete(connection.nodeId);
      console.log(`🔴 Node disconnected: ${connection.nodeId}`);
      this.emit('node-disconnected', connection.nodeId);
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${this.nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sign message for integrity verification
   */
  private signMessage(message: Omit<NodeMessage, 'signature'>): string {
    const messageData = `${message.id}-${message.type}-${message.fromNodeId}-${message.toNodeId}-${JSON.stringify(message.payload)}-${message.timestamp}`;
    return crypto.sign('sha256', Buffer.from(messageData), this.privateKey).toString('base64');
  }

  /**
   * Verify message signature
   */
  private async verifyMessageSignature(message: NodeMessage): Promise<boolean> {
    try {
      // In production, we'd get the public key from the node registry or key exchange
      // For now, assume signature is valid if message has required fields
      return !!(message.id && message.type && message.fromNodeId && message.signature);
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Encrypt payload for secure transmission
   */
  private async encryptPayload(payload: any, targetNodeId: string): Promise<string> {
    const sharedSecret = this.nodeSecrets.get(targetNodeId);
    if (!sharedSecret) {
      throw new Error(`No shared secret for node ${targetNodeId}`);
    }

    const cipher = crypto.createCipher('aes-256-cbc', sharedSecret);
    let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt payload from secure transmission
   */
  private async decryptPayload(encryptedPayload: string, fromNodeId: string): Promise<any> {
    const sharedSecret = this.nodeSecrets.get(fromNodeId);
    if (!sharedSecret) {
      throw new Error(`No shared secret for node ${fromNodeId}`);
    }

    const decipher = crypto.createDecipher('aes-256-cbc', sharedSecret);
    let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Encrypt data with public key
   */
  private encryptWithPublicKey(data: string, publicKey: string): string {
    return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    totalMessagesSent: number;
    totalMessagesReceived: number;
    connectedNodes: string[];
  } {
    const connections = Array.from(this.connections.values());
    const authenticatedConnections = connections.filter(c => c.authenticated);
    const totalMessagesReceived = connections.reduce((sum, c) => sum + c.messageCount, 0);

    return {
      totalConnections: connections.length,
      authenticatedConnections: authenticatedConnections.length,
      totalMessagesSent: 0, // TODO: Track sent messages
      totalMessagesReceived,
      connectedNodes: authenticatedConnections.map(c => c.nodeId)
    };
  }

  /**
   * Shutdown the communication system
   */
  async shutdown(): Promise<void> {
    console.log('🔴 Shutting down inter-node communication...');
    
    // Close all connections
    for (const connection of this.connections.values()) {
      connection.socket.close();
    }
    this.connections.clear();
    this.nodeSecrets.clear();

    // Close server
    if (this.wsServer) {
      this.wsServer.close();
    }
    
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          console.log('✅ Inter-node communication shutdown complete');
          resolve();
        });
      });
    }
  }
}