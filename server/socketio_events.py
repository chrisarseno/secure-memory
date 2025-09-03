"""
Socket.IO event handlers for real-time consciousness monitoring.
"""

import logging
from flask_socketio import SocketIO, emit, join_room, leave_room
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def setup_socketio_events(socketio: SocketIO, consciousness_core):
    """Setup Socket.IO event handlers."""
    
    @socketio.on('connect')
    def handle_connect(auth):
        """Handle client connection."""
        logger.info("Client connected to consciousness monitoring")
        emit('status', {'message': 'Connected to consciousness system'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection."""
        logger.info("Client disconnected from consciousness monitoring")
    
    @socketio.on('join_monitoring')
    def handle_join_monitoring(data):
        """Handle client joining monitoring room."""
        room = data.get('room', 'general_monitoring')
        join_room(room)
        
        # Send current system state
        if consciousness_core and consciousness_core.initialized:
            system_state = consciousness_core.get_system_state()
            emit('system_state_update', system_state, room=room)
        
        logger.info(f"Client joined monitoring room: {room}")
    
    @socketio.on('leave_monitoring')
    def handle_leave_monitoring(data):
        """Handle client leaving monitoring room."""
        room = data.get('room', 'general_monitoring')
        leave_room(room)
        logger.info(f"Client left monitoring room: {room}")
    
    @socketio.on('request_system_state')
    def handle_system_state_request():
        """Handle request for current system state."""
        if consciousness_core and consciousness_core.initialized:
            system_state = consciousness_core.get_system_state()
            emit('system_state_update', system_state)
        else:
            emit('error', {'message': 'Consciousness system not initialized'})
    
    @socketio.on('emergency_stop')
    def handle_emergency_stop():
        """Handle emergency stop request."""
        if consciousness_core:
            success = consciousness_core.emergency_stop()
            if success:
                emit('emergency_stop_confirmed', {'message': 'Emergency stop activated'})
                # Broadcast to all clients
                socketio.emit('system_emergency_stop', {'message': 'System emergency stop activated'})
            else:
                emit('error', {'message': 'Failed to activate emergency stop'})
        else:
            emit('error', {'message': 'Consciousness system not available'})
    
    @socketio.on('resume_system')
    def handle_resume_system():
        """Handle system resume request."""
        if consciousness_core:
            success = consciousness_core.resume_system()
            if success:
                emit('system_resumed', {'message': 'System resumed successfully'})
                socketio.emit('system_status_change', {'status': 'active'})
            else:
                emit('error', {'message': 'Failed to resume system'})
        else:
            emit('error', {'message': 'Consciousness system not available'})
    
    @socketio.on('pause_system')
    def handle_pause_system():
        """Handle system pause request."""
        if consciousness_core:
            success = consciousness_core.pause_system()
            if success:
                emit('system_paused', {'message': 'System paused successfully'})
                socketio.emit('system_status_change', {'status': 'paused'})
            else:
                emit('error', {'message': 'Failed to pause system'})
        else:
            emit('error', {'message': 'Consciousness system not available'})
    
    @socketio.on('process_experience')
    def handle_process_experience(data):
        """Handle experience processing request."""
        if consciousness_core and consciousness_core.initialized:
            try:
                experience_data = data.get('experience', {})
                result = consciousness_core.process_experience(experience_data)
                emit('experience_processed', {
                    'success': True,
                    'result': result
                })
                
                # Broadcast activity update
                socketio.emit('activity_update', {
                    'type': 'experience_processed',
                    'timestamp': result.get('timestamp'),
                    'description': f"Processed experience: {experience_data.get('type', 'unknown')}"
                }, room='general_monitoring')
                
            except Exception as e:
                emit('error', {'message': f'Failed to process experience: {str(e)}'})
        else:
            emit('error', {'message': 'Consciousness system not ready'})
    
    def broadcast_system_update(system_state: Dict[str, Any]):
        """Broadcast system state update to all monitoring clients."""
        socketio.emit('system_state_update', system_state, room='general_monitoring')
    
    def broadcast_activity(activity: Dict[str, Any]):
        """Broadcast activity update to all monitoring clients."""
        socketio.emit('activity_update', activity, room='general_monitoring')
    
    def broadcast_alert(alert: Dict[str, Any]):
        """Broadcast safety alert to all monitoring clients."""
        socketio.emit('safety_alert', alert, room='general_monitoring')
    
    # Store broadcast functions for use by consciousness core
    socketio.broadcast_system_update = broadcast_system_update
    socketio.broadcast_activity = broadcast_activity
    socketio.broadcast_alert = broadcast_alert
    
    return socketio
