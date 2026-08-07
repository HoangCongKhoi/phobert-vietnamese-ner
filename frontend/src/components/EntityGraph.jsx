import React, { useState, useEffect, useRef } from 'react';
import { Network, Sparkles, Info } from 'lucide-react';

export default function EntityGraph({ result }) {
  const [activeNode, setActiveNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const animationFrameRef = useRef(null);
  const simulationRef = useRef({ running: false, iteration: 0 });

  if (!result || !result.entities || result.entities.length === 0) {
    return (
      <div style={{
        background: 'var(--surface-card)',
        border: '1px dashed var(--hairline)',
        borderRadius: '12px',
        padding: '48px 32px',
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}>
        <Network style={{ width: 28, height: 28, color: 'var(--muted-soft)' }} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>
          Chưa có dữ liệu mạng lưới thực thể.
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted-soft)', textAlign: 'center', maxWidth: '320px' }}>
          Nhập văn bản để hệ thống tự động sinh Sơ đồ Tri thức Y tế (Knowledge Graph).
        </p>
      </div>
    );
  }

  const { entities, metadata } = result;

  // Initialize force-directed graph
  useEffect(() => {
    const uniqueEntitiesMap = new Map();
    entities.forEach((ent) => {
      const key = `${ent.label}:${ent.word}`;
      if (!uniqueEntitiesMap.has(key)) uniqueEntitiesMap.set(key, ent);
    });
    const uniqueEntities = Array.from(uniqueEntitiesMap.values());

    const width = 620;
    const height = 380;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize nodes with random positions
    const initialNodes = uniqueEntities.map((ent, idx) => {
      const angle = Math.random() * 2 * Math.PI;
      const radius = 80 + Math.random() * 100;
      const meta = metadata?.[ent.label] || { color: '#6c6a64', bg: '#efe9de', name: ent.label };
      
      return {
        ...ent,
        id: `node-${idx}`,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        meta,
        fixed: false,
      };
    });

    // Build relationships between entities
    const relationships = buildRelationships(initialNodes);
    
    setNodes(initialNodes);
    setEdges(relationships);

    // Start force simulation
    simulationRef.current = { running: true, iteration: 0 };
    const maxIterations = 500; // More iterations for better settling

    const simulate = () => {
      if (!simulationRef.current.running || simulationRef.current.iteration >= maxIterations) {
        simulationRef.current.running = false;
        return;
      }

      setNodes((prevNodes) => {
        const updatedNodes = forceSimulationStep(prevNodes, relationships, width, height);
        simulationRef.current.iteration++;
        return updatedNodes;
      });

      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      simulationRef.current.running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [entities, metadata]);

  // Build entity-to-entity relationships (smart and selective)
  const buildRelationships = (nodeList) => {
    const relationships = [];
    
    // Find central entities
    const patientNodes = nodeList.filter(n => n.label === 'PATIENT_ID');
    const nameNodes = nodeList.filter(n => n.label === 'NAME');
    const diseaseNodes = nodeList.filter(n => n.label === 'DISEASE');
    const symptomNodes = nodeList.filter(n => n.label === 'SYMPTOM');
    const orgNodes = nodeList.filter(n => n.label === 'ORGANIZATION');
    const locationNodes = nodeList.filter(n => n.label === 'LOCATION');
    const dateNodes = nodeList.filter(n => n.label === 'DATE');
    const ageNodes = nodeList.filter(n => n.label === 'AGE');
    const genderNodes = nodeList.filter(n => n.label === 'GENDER');
    const jobNodes = nodeList.filter(n => n.label === 'JOB');

    // Choose the main patient node (hub)
    const mainPatient = patientNodes[0] || nameNodes[0];
    
    if (mainPatient) {
      // Connect patient to demographics (AGE, GENDER, JOB)
      ageNodes.forEach(node => {
        relationships.push({
          source: mainPatient.id,
          target: node.id,
          type: 'has_age',
          label: 'tuổi',
          color: '#D97706',
          weight: 1.5,
        });
      });
      
      genderNodes.forEach(node => {
        relationships.push({
          source: mainPatient.id,
          target: node.id,
          type: 'has_gender',
          label: 'giới tính',
          color: '#7C3AED',
          weight: 1.5,
        });
      });
      
      jobNodes.forEach(node => {
        relationships.push({
          source: mainPatient.id,
          target: node.id,
          type: 'has_occupation',
          label: 'nghề',
          color: '#DB2777',
          weight: 1.5,
        });
      });

      // Connect patient to location (lives in)
      if (locationNodes.length > 0) {
        relationships.push({
          source: mainPatient.id,
          target: locationNodes[0].id,
          type: 'lives_in',
          label: 'sống tại',
          color: '#0D9488',
          weight: 2,
        });
      }

      // Connect patient to organization (admitted to)
      orgNodes.forEach(org => {
        relationships.push({
          source: mainPatient.id,
          target: org.id,
          type: 'admitted_to',
          label: 'nhập viện',
          color: '#7C3AED',
          weight: 2.5,
        });
      });

      // Connect patient to symptoms
      symptomNodes.forEach(symptom => {
        relationships.push({
          source: mainPatient.id,
          target: symptom.id,
          type: 'has_symptom',
          label: 'triệu chứng',
          color: '#B45309',
          weight: 2,
        });
      });

      // Connect patient to disease (diagnosis)
      diseaseNodes.forEach(disease => {
        relationships.push({
          source: mainPatient.id,
          target: disease.id,
          type: 'diagnosed_with',
          label: 'chẩn đoán',
          color: '#991B1B',
          weight: 2.5,
        });
      });
    }

    // Connect symptoms to disease (leads to)
    symptomNodes.forEach(symptom => {
      diseaseNodes.forEach(disease => {
        relationships.push({
          source: symptom.id,
          target: disease.id,
          type: 'leads_to',
          label: 'dẫn đến',
          color: '#DB2777',
          weight: 2,
        });
      });
    });

    // Connect organization to location
    orgNodes.forEach(org => {
      if (locationNodes.length > 0) {
        relationships.push({
          source: org.id,
          target: locationNodes[0].id,
          type: 'located_in',
          label: 'tại',
          color: '#DC2626',
          weight: 1.5,
        });
      }
    });

    // Connect disease to location (outbreak)
    if (diseaseNodes.length > 0 && locationNodes.length > 0) {
      relationships.push({
        source: diseaseNodes[0].id,
        target: locationNodes[0].id,
        type: 'outbreak_in',
        label: 'lưu hành',
        color: '#EA580C',
        weight: 2,
      });
    }

    // Connect organization/symptom to date (only first date)
    if (dateNodes.length > 0) {
      const firstDate = dateNodes[0];
      
      if (orgNodes.length > 0) {
        relationships.push({
          source: orgNodes[0].id,
          target: firstDate.id,
          type: 'visited_on',
          label: 'khám vào',
          color: '#4F46E5',
          weight: 1.5,
        });
      }
      
      if (symptomNodes.length > 0) {
        relationships.push({
          source: symptomNodes[0].id,
          target: firstDate.id,
          type: 'appeared_on',
          label: 'xuất hiện',
          color: '#F59E0B',
          weight: 1.5,
        });
      }
    }

    // Connect name to job (works at - if job looks like workplace)
    nameNodes.forEach(name => {
      orgNodes.forEach(org => {
        relationships.push({
          source: name.id,
          target: org.id,
          type: 'works_at',
          label: 'làm việc',
          color: '#4F46E5',
          weight: 1.5,
        });
      });
    });

    return relationships;
  };

  // Force-directed layout simulation step
  const forceSimulationStep = (nodeList, edgeList, width, height) => {
    const alpha = 0.4;
    const repulsionStrength = 5000; // Increased for more spacing
    const attractionStrength = 0.005; // Reduced to allow more spread
    const centeringStrength = 0.01;
    const minDistance = 80; // Minimum distance between nodes
    const centerX = width / 2;
    const centerY = height / 2;

    const newNodes = nodeList.map(node => ({ ...node }));

    // Apply repulsion forces (all nodes repel each other strongly)
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[j].x - newNodes[i].x;
        const dy = newNodes[j].y - newNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        
        // Much stronger repulsion when nodes are too close
        let force;
        if (dist < minDistance) {
          force = repulsionStrength * 2 / (dist * dist); // Extra strong when too close
        } else {
          force = repulsionStrength / (dist * dist);
        }
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        newNodes[i].vx -= fx;
        newNodes[i].vy -= fy;
        newNodes[j].vx += fx;
        newNodes[j].vy += fy;
      }
    }

    // Apply attraction forces along edges (weaker, only for connected nodes)
    edgeList.forEach(edge => {
      const source = newNodes.find(n => n.id === edge.source);
      const target = newNodes.find(n => n.id === edge.target);
      
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const idealLength = 120; // Ideal edge length
        const force = (dist - idealLength) * attractionStrength * edge.weight;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    });

    // Apply gentle centering force
    newNodes.forEach(node => {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * centeringStrength;
      node.vy += dy * centeringStrength;
    });

    // Update positions with collision detection
    newNodes.forEach(node => {
      if (!node.fixed) {
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;
        node.vx *= 0.8; // More damping for stability
        node.vy *= 0.8;
        
        // Keep within bounds with padding
        const padding = 50;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      }
    });

    return newNodes;
  };

  // Calculate node size based on connections
  const getNodeRadius = (nodeId) => {
    const connections = edges.filter(e => e.source === nodeId || e.target === nodeId).length;
    if (connections === 0) return 18;
    if (connections <= 3) return 24;
    if (connections <= 6) return 32;
    return 40;
  };

  const width = 620;
  const height = 380;

  return (
    <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Network style={{ width: 14, height: 14, color: 'var(--muted)' }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--body-strong)' }}>
          Knowledge Graph · Mạng lưới Thực thể
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'var(--muted)',
          background: 'var(--surface-card)',
          border: '1px solid var(--hairline)',
          borderRadius: '6px',
          padding: '3px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          <Sparkles style={{ width: 10, height: 10, color: 'var(--coral)' }} />
          Nodes: {nodes.length} · Edges: {edges.length}
        </span>
      </div>

      {/* Graph container — dark surface, code-window-card style */}
      <div style={{
        background: 'var(--surface-dark)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(250,249,245,0.06)',
      }}>
        {/* Window chrome strip */}
        <div style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(250,249,245,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--surface-dark-elevated)',
        }}>
          {['#c64545', '#e8a55a', '#5db872'].map((c, i) => (
            <span key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.6 }} />
          ))}
          <span style={{ marginLeft: '8px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--on-dark-soft)' }}>
            entity_knowledge_graph.svg
          </span>
        </div>

        {/* SVG Canvas */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
          background: 'var(--surface-dark-soft)',
          overflowX: 'auto',
        }}>
          <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: '640px', height: 'auto', userSelect: 'none' }}>
            <defs>
              {/* Ambient gradient for modern look */}
              <radialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
              </radialGradient>
              {/* Arrow marker for directed edges */}
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="rgba(250,249,245,0.3)" />
              </marker>
            </defs>

            {/* Background ambient glow */}
            <circle cx={width / 2} cy={height / 2} r="200" fill="url(#ambientGlow)" />

            {/* Draw edges first (behind nodes) */}
            {edges.map((edge, idx) => {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;
              
              const isHovered = activeNode === edge.source || activeNode === edge.target;
              const midX = (sourceNode.x + targetNode.x) / 2;
              const midY = (sourceNode.y + targetNode.y) / 2;
              
              // Calculate label width based on text length
              const labelWidth = Math.max(edge.label.length * 6 + 12, 50);
              
              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={isHovered ? edge.color : 'rgba(250,249,245,0.15)'}
                    strokeWidth={isHovered ? edge.weight : edge.weight * 0.7}
                    opacity={isHovered ? 1 : 0.6}
                    markerEnd="url(#arrowhead)"
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Relation label pill */}
                  <rect
                    x={midX - labelWidth / 2}
                    y={midY - 9}
                    width={labelWidth}
                    height="18"
                    rx="5"
                    fill="var(--surface-dark-elevated)"
                    stroke={isHovered ? edge.color : 'rgba(250,249,245,0.1)'}
                    strokeWidth="1"
                    opacity={isHovered ? 1 : 0.85}
                    style={{ transition: 'all 0.2s' }}
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill={isHovered ? edge.color : 'var(--on-dark-soft)'}
                    fontSize="8.5"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    opacity={isHovered ? 1 : 0.7}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Draw nodes on top */}
            {nodes.map((node) => {
              const isHovered = activeNode === node.id;
              const nodeRadius = getNodeRadius(node.id);
              const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
              const connectionCount = connectedEdges.length;
              
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActiveNode(node.id)}
                  onMouseLeave={() => setActiveNode(null)}
                >
                  {/* Glow effect when hovered */}
                  {isHovered && (
                    <circle
                      r={nodeRadius + 8}
                      fill="none"
                      stroke={node.meta.color}
                      strokeWidth="2"
                      opacity="0.3"
                    />
                  )}
                  {/* Main node circle */}
                  <circle
                    r={isHovered ? nodeRadius + 4 : nodeRadius}
                    fill={isHovered ? (node.meta.bg || 'var(--surface-dark-elevated)') : 'var(--surface-dark-elevated)'}
                    stroke={node.meta.color || 'rgba(250,249,245,0.3)'}
                    strokeWidth={isHovered ? 3 : 2}
                    opacity={isHovered ? 1 : (activeNode ? 0.4 : 0.9)}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {/* Node label (entity word) */}
                  <text
                    textAnchor="middle"
                    y="-4"
                    fill="#faf9f5"
                    fontSize={Math.min(10, nodeRadius / 3)}
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    opacity={isHovered ? 1 : (activeNode ? 0.5 : 0.95)}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {node.word.length > 12 ? `${node.word.slice(0, 11)}…` : node.word}
                  </text>
                  {/* Node type label */}
                  <text
                    textAnchor="middle"
                    y="10"
                    fill={node.meta.color || 'var(--on-dark-soft)'}
                    fontSize="7.5"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    opacity={isHovered ? 1 : (activeNode ? 0.5 : 0.85)}
                    style={{ transition: 'all 0.2s' }}
                  >
                    {node.label}
                  </text>
                  {/* Connection count badge for important nodes */}
                  {connectionCount > 3 && (
                    <>
                      <circle
                        cx={nodeRadius - 6}
                        cy={-nodeRadius + 6}
                        r="8"
                        fill="var(--coral)"
                        opacity="0.9"
                      />
                      <text
                        x={nodeRadius - 6}
                        y={-nodeRadius + 9}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="7"
                        fontWeight="700"
                        fontFamily="Inter, sans-serif"
                      >
                        {connectionCount}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Enhanced hint with stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        padding: '9px 14px',
        background: 'var(--surface-soft)',
        borderRadius: '8px',
        border: '1px solid var(--hairline)',
      }}>
        <Info style={{ width: 13, height: 13, color: 'var(--muted)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--muted)' }}>
          Sơ đồ tri thức thực thể với {edges.length} quan hệ được phát hiện tự động. Rê chuột vào node để xem chi tiết.
        </span>
      </div>
    </div>
  );
}
