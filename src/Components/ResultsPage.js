import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Col, Row, Container, Table } from 'react-bootstrap';
import { ArrowLeft, Download, BarChart, GraphUp, ArrowLeftRight, Link, People } from 'react-bootstrap-icons';
import axios from 'axios';
import { API_BASE_URL } from './api';

// Statistical Analysis Functions
const calculateCorrelation = (data1, data2) => {
  const n = data1.length;
  if (n !== data2.length || n === 0) return 0;
  
  const sum1 = data1.reduce((a, b) => a + b, 0);
  const sum2 = data2.reduce((a, b) => a + b, 0);
  const sum1Sq = data1.reduce((a, b) => a + b * b, 0);
  const sum2Sq = data2.reduce((a, b) => a + b * b, 0);
  const pSum = data1.reduce((a, b, i) => a + b * data2[i], 0);
  
  const num = pSum - (sum1 * sum2 / n);
  const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
  
  return den === 0 ? 0 : num / den;
};



const renderCorrelationAnalysis = (stats, results) => {
  const categories = Object.keys(stats.categoryStats);
  const correlations = [];
  
  // Calculate correlations between categories
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];
      
      // Create binary vectors for each video
      const cat1Vector = results.map(r => {
        if (r.status === 'excluded' || !r.categories) return 0;
        return r.categories.includes(cat1) ? 1 : 0;
      });
      
      const cat2Vector = results.map(r => {
        if (r.status === 'excluded' || !r.categories) return 0;
        return r.categories.includes(cat2) ? 1 : 0;
      });
      
      const correlation = calculateCorrelation(cat1Vector, cat2Vector);
      correlations.push({
        category1: cat1,
        category2: cat2,
        correlation: correlation
      });
    }
  }
  
  correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  
  return (
    <div>
      <h6>Category Correlations (All Combinations)</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Equation:</strong> Pearson's r = Σ(x-x̄)(y-ȳ) / √[Σ(x-x̄)² × Σ(y-ȳ)²]<br/>
        Where x,y are binary vectors (1=category present, 0=absent) for each video
      </small>
      {correlations.length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Category 1</th>
              <th>Category 2</th>
              <th>Correlation</th>
              <th>Strength</th>
            </tr>
          </thead>
          <tbody>
            {correlations.map((corr, index) => (
              <tr key={index}>
                <td><strong>{corr.category1}</strong></td>
                <td><strong>{corr.category2}</strong></td>
                <td className="text-center">{corr.correlation.toFixed(3)}</td>
                <td className="text-center">
                  <span className={`badge ${Math.abs(corr.correlation) > 0.7 ? 'bg-danger' : 
                    Math.abs(corr.correlation) > 0.5 ? 'bg-warning' : 
                    Math.abs(corr.correlation) > 0.1 ? 'bg-info' : 'bg-secondary'}`}>
                    {Math.abs(corr.correlation) > 0.7 ? 'Strong' : 
                     Math.abs(corr.correlation) > 0.5 ? 'Moderate' : 
                     Math.abs(corr.correlation) > 0.1 ? 'Weak' : 'None'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No correlations found.</p>
      )}
    </div>
  );
};

const renderCooccurrenceAnalysis = (stats, results) => {
  const allTags = new Set();
  const tagCooccurrence = {};
  
  // Collect all tags and initialize co-occurrence matrix
  results.forEach(result => {
    if (result.categories && result.status !== 'excluded') {
      const tags = result.categories.split(';').flatMap(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) return [];
        const tags = pair.substring(colonIndex + 1).trim();
        return tags.split(',').map(t => t.trim()).filter(t => t);
      });
      tags.forEach(tag => allTags.add(tag));
    }
  });
  
  // Initialize co-occurrence matrix
  allTags.forEach(tag1 => {
    tagCooccurrence[tag1] = {};
    allTags.forEach(tag2 => {
      tagCooccurrence[tag1][tag2] = 0;
    });
  });
  
  // Calculate co-occurrences
  results.forEach(result => {
    if (result.categories && result.status !== 'excluded') {
      const tags = result.categories.split(';').flatMap(pair => {
        const colonIndex = pair.indexOf(':');
        if (colonIndex === -1) return [];
        const tags = pair.substring(colonIndex + 1).trim();
        return tags.split(',').map(t => t.trim()).filter(t => t);
      });
      
      tags.forEach(tag1 => {
        tags.forEach(tag2 => {
          if (tag1 !== tag2) {
            tagCooccurrence[tag1][tag2]++;
          }
        });
      });
    }
  });
  
  // Find top co-occurring pairs
  const cooccurrencePairs = [];
  allTags.forEach(tag1 => {
    allTags.forEach(tag2 => {
      if (tag1 < tag2 && tagCooccurrence[tag1][tag2] > 0) {
        cooccurrencePairs.push({
          tag1,
          tag2,
          count: tagCooccurrence[tag1][tag2]
        });
      }
    });
  });
  
  cooccurrencePairs.sort((a, b) => b.count - a.count);
  
  return (
    <div>
      <h6>Top Tag Co-occurrences</h6>
      {cooccurrencePairs.length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Tag 1</th>
              <th>Tag 2</th>
              <th>Co-occurrences</th>
            </tr>
          </thead>
          <tbody>
            {cooccurrencePairs.slice(0, 5).map((pair, index) => (
              <tr key={index}>
                <td><span className="badge bg-primary">{pair.tag1}</span></td>
                <td><span className="badge bg-secondary">{pair.tag2}</span></td>
                <td className="text-center">{pair.count}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No co-occurrences found.</p>
      )}
    </div>
  );
};

const renderCoderAgreementAnalysis = (stats, results) => {
  const coders = Object.keys(stats.coderStats);
  if (coders.length < 2) {
    return <p className="text-muted">Need at least 2 coders for agreement analysis.</p>;
  }
  
  // Group results by video_id
  const videoResults = {};
  results.forEach(result => {
    if (!videoResults[result.video_id]) {
      videoResults[result.video_id] = [];
    }
    videoResults[result.video_id].push(result);
  });
  
  // Calculate agreement metrics
  let totalTagComparisons = 0;
  let totalTagAgreements = 0;
  const categoryTagAgreements = {};
  
  Object.values(videoResults).forEach(videoResult => {
    if (videoResult.length >= 2) {
      for (let i = 0; i < videoResult.length; i++) {
        for (let j = i + 1; j < videoResult.length; j++) {
          const coder1 = videoResult[i];
          const coder2 = videoResult[j];
          
          if (coder1.status !== 'excluded' && coder2.status !== 'excluded') {
            // Parse categories and tags for both coders
            const parseCategoriesAndTags = (categoriesStr) => {
              if (!categoriesStr || !categoriesStr.trim()) return {};
              const result = {};
              categoriesStr.split(';').forEach(pair => {
                const trimmedPair = pair.trim();
                if (!trimmedPair) return;
                const colonIndex = trimmedPair.indexOf(':');
                if (colonIndex > -1) {
                  const category = trimmedPair.substring(0, colonIndex).trim();
                  const tags = trimmedPair.substring(colonIndex + 1).trim();
                  if (category && tags) {
                    result[category] = tags.split(',').map(t => t.trim()).filter(t => t);
                  }
                }
              });
              return result;
            };
            
            const coder1Data = parseCategoriesAndTags(coder1.categories);
            const coder2Data = parseCategoriesAndTags(coder2.categories);
            
            // Compare tags within each category
            const allCategories = new Set([...Object.keys(coder1Data), ...Object.keys(coder2Data)]);
            
            allCategories.forEach(category => {
              const tags1 = coder1Data[category] || [];
              const tags2 = coder2Data[category] || [];
              
              // Only compare if both coders have tags for this category
              if (tags1.length > 0 && tags2.length > 0) {
                // Count tag comparisons and agreements
                const totalTags = Math.max(tags1.length, tags2.length);
                totalTagComparisons += totalTags;
                
                // Count matching tags
                const matchingTags = tags1.filter(tag => tags2.includes(tag));
                totalTagAgreements += matchingTags.length;
                
                // Track category-specific agreements
                if (!categoryTagAgreements[category]) {
                  categoryTagAgreements[category] = { comparisons: 0, agreements: 0 };
                }
                categoryTagAgreements[category].comparisons += totalTags;
                categoryTagAgreements[category].agreements += matchingTags.length;
              }
            });
          }
        }
      }
    }
  });
  
  const overallAgreement = totalTagComparisons > 0 ? (totalTagAgreements / totalTagComparisons * 100) : 0;
  
  return (
    <div>
      <h6>Inter-Coder Agreement</h6>
      <small className="text-muted mb-3 d-block">
        <strong>Method:</strong> Tag-level agreement within categories<br/>
        Agreement = (matching tag selections) / (total tag selections compared)<br/>
        Only compares categories where both coders selected tags
      </small>
      <div className="mb-3">
        <strong>Overall Agreement:</strong> {overallAgreement.toFixed(1)}%
        <div className="progress mt-1" style={{ height: '20px' }}>
          <div 
            className={`progress-bar ${overallAgreement > 80 ? 'bg-success' : 
              overallAgreement > 60 ? 'bg-warning' : 'bg-danger'}`}
            style={{ width: `${Math.min(overallAgreement, 100)}%` }}
          />
        </div>
        <small className="text-muted">
          Based on {totalTagComparisons} tag comparisons between {coders.length} coders
        </small>
      </div>
      
      <h6>Category-Specific Agreement</h6>
      {Object.keys(categoryTagAgreements).length > 0 ? (
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Category</th>
              <th>Tag Agreements</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(categoryTagAgreements)
              .sort(([,a], [,b]) => (b.agreements / b.comparisons) - (a.agreements / a.comparisons))
              .slice(0, 5)
              .map(([category, data]) => (
                <tr key={category}>
                  <td><strong>{category}</strong></td>
                  <td className="text-center">{data.agreements} / {data.comparisons}</td>
                  <td className="text-center">
                    {((data.agreements / data.comparisons) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No tag agreements found.</p>
      )}
    </div>
  );
};

const renderDistributionAnalysis = (stats, results) => {
  // Calculate coding completeness statistics
  const validResults = results.filter(r => r.status !== 'excluded');
  const totalVideos = validResults.length;
  const totalExpectedCategories = totalVideos * Object.keys(stats.categoryStats).length;
  
  // Count how many categories were actually coded
  let totalCodedCategories = 0;
  validResults.forEach(result => {
    if (result.categories && result.categories.trim()) {
      const categoryCount = result.categories.split(';').filter(pair => {
        const trimmedPair = pair.trim();
        if (!trimmedPair) return false;
        const colonIndex = trimmedPair.indexOf(':');
        if (colonIndex > -1) {
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          return tags && tags.length > 0;
        }
        return false;
      }).length;
      totalCodedCategories += categoryCount;
    }
  });
  
  const completenessRate = totalExpectedCategories > 0 ? (totalCodedCategories / totalExpectedCategories * 100) : 0;
  
  // Calculate tag diversity statistics
  const allTags = Object.keys(stats.tagStats);
  const tagUsageCounts = Object.values(stats.tagStats);
  const usedTags = tagUsageCounts.filter(count => count > 0).length;
  const tagDiversityRate = allTags.length > 0 ? (usedTags / allTags.length * 100) : 0;
  
  // Calculate average tags per video
  let totalTagsSelected = 0;
  validResults.forEach(result => {
    if (result.categories && result.categories.trim()) {
      result.categories.split(';').forEach(pair => {
        const trimmedPair = pair.trim();
        if (!trimmedPair) return;
        const colonIndex = trimmedPair.indexOf(':');
        if (colonIndex > -1) {
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          if (tags) {
            totalTagsSelected += tags.split(',').map(t => t.trim()).filter(t => t).length;
          }
        }
      });
    }
  });
  
  const avgTagsPerVideo = totalVideos > 0 ? (totalTagsSelected / totalVideos) : 0;
  
  // Calculate most/least used tags
  const sortedTags = Object.entries(stats.tagStats)
    .sort(([,a], [,b]) => b - a)
    .filter(([,count]) => count > 0);
  
  const mostUsedTags = sortedTags.slice(0, 3);
  const leastUsedTags = sortedTags.slice(-3).reverse();
  
  return (
    <div>
      <h6>Coding Quality & Diversity Analysis</h6>
      
      <div className="row">
        <div className="col-6">
          <h6 className="text-primary">Coding Completeness</h6>
          <small className="text-muted mb-2 d-block">
            Measures how thoroughly videos are coded across all categories
          </small>
          <Table striped bordered hover size="sm">
            <tbody>
              <tr>
                <td>Completeness Rate</td>
                <td className="text-center">{completenessRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Coded Categories</td>
                <td className="text-center">{totalCodedCategories} / {totalExpectedCategories}</td>
              </tr>
              <tr>
                <td>Average Tags per Video</td>
                <td className="text-center">{avgTagsPerVideo.toFixed(1)}</td>
              </tr>
              <tr>
                <td>Total Tags Selected</td>
                <td className="text-center">{totalTagsSelected}</td>
              </tr>
            </tbody>
          </Table>
        </div>
        
        <div className="col-6">
          <h6 className="text-success">Tag Diversity</h6>
          <small className="text-muted mb-2 d-block">
            Measures how well the tag vocabulary is being utilized
          </small>
          <Table striped bordered hover size="sm">
            <tbody>
              <tr>
                <td>Tag Diversity Rate</td>
                <td className="text-center">{tagDiversityRate.toFixed(1)}%</td>
              </tr>
              <tr>
                <td>Tags Used</td>
                <td className="text-center">{usedTags} / {allTags.length}</td>
              </tr>
              <tr>
                <td>Most Used Tag</td>
                <td className="text-center">
                  {mostUsedTags.length > 0 ? (
                    <span className="badge bg-primary">{mostUsedTags[0][0]} ({mostUsedTags[0][1]})</span>
                  ) : 'None'}
                </td>
              </tr>
              <tr>
                <td>Least Used Tag</td>
                <td className="text-center">
                  {leastUsedTags.length > 0 ? (
                    <span className="badge bg-secondary">{leastUsedTags[0][0]} ({leastUsedTags[0][1]})</span>
                  ) : 'None'}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </div>
      
      <div className="mt-3">
        <h6>Quality Metrics</h6>
        <small className="text-muted">
          <strong>Coding Completeness:</strong> Percentage of expected category-video combinations that were actually coded<br/>
          <strong>Tag Diversity:</strong> Percentage of available tags that were actually used<br/>
          <strong>Average Tags per Video:</strong> Measures coding density and thoroughness<br/>
          <strong>Most/Least Used Tags:</strong> Identifies popular and underutilized tags<br/>
          <strong>Interpretation:</strong> Higher completeness and diversity rates indicate better coding quality
        </small>
      </div>
    </div>
  );
};

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { project } = location.state || {};

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current);
    return result;
  };

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/download-results?project=${project.slug}&format=text`);
      
      // Parse CSV data
      const csvText = response.data;
      const lines = csvText.split('\n');
      const headers = parseCSVLine(lines[0]);
      const data = lines.slice(1).filter(line => line.trim()).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      });

      setResults(data);
    } catch (err) {
      console.error('Failed to load results:', err);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [project?.slug]);

  useEffect(() => {
    if (!project?.slug) {
      setError('No project selected');
      setLoading(false);
      return;
    }

    loadResults();
  }, [project, loadResults]);

  const calculateStats = () => {
    if (!results) return null;

    const stats = {
      totalVideos: results.length,
      excludedVideos: results.filter(r => r.status === 'excluded').length,
      submittedVideos: results.filter(r => r.status === 'submitted').length,
      savedVideos: results.filter(r => r.status === 'saved').length,
      categoryStats: {},
      tagStats: {},
      coderStats: {}
    };

    // Calculate category and tag statistics (excluding excluded videos)
    const validResults = results.filter(r => r.status !== 'excluded');
    
    // First pass: collect all categories and their associated tags from all results
    const categoryTagMap = new Map(); // category -> Set of tags
    
    results.forEach(result => {
      if (result.categories && result.categories.trim()) {
        const categoryPairs = result.categories.split(';');
        categoryPairs.forEach(pair => {
          const trimmedPair = pair.trim();
          if (!trimmedPair) return;
          
          const colonIndex = trimmedPair.indexOf(':');
          if (colonIndex === -1) return;
          
          const category = trimmedPair.substring(0, colonIndex).trim();
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          
          if (category && tags) {
            if (!categoryTagMap.has(category)) {
              categoryTagMap.set(category, new Set());
            }
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
            tagList.forEach(tag => categoryTagMap.get(category).add(tag));
          }
        });
      }
    });
    
    // Initialize all categories with their correct tags
    categoryTagMap.forEach((tags, category) => {
      if (!stats.categoryStats[category]) {
        stats.categoryStats[category] = { count: 0, tags: {} };
      }
      tags.forEach(tag => {
        stats.categoryStats[category].tags[tag] = 0;
      });
    });
    
    validResults.forEach(result => {
      // Count by coder
      const coder = result.coder;
      if (!stats.coderStats[coder]) {
        stats.coderStats[coder] = { total: 0, submitted: 0, saved: 0 };
      }
      stats.coderStats[coder].total++;
      if (result.status === 'submitted') {
        stats.coderStats[coder].submitted++;
      } else {
        stats.coderStats[coder].saved++;
      }

      // Parse categories and tags
      if (result.categories && result.categories.trim()) {
        const categoryPairs = result.categories.split(';');
        categoryPairs.forEach(pair => {
          const trimmedPair = pair.trim();
          if (!trimmedPair) return;
          
          const colonIndex = trimmedPair.indexOf(':');
          if (colonIndex === -1) return;
          
          const category = trimmedPair.substring(0, colonIndex).trim();
          const tags = trimmedPair.substring(colonIndex + 1).trim();
          
          if (category && tags) {
            // Count category
            if (!stats.categoryStats[category]) {
              stats.categoryStats[category] = { count: 0, tags: {} };
            }
            stats.categoryStats[category].count++;

            // Count individual tags
            const tagList = tags.split(',').map(t => t.trim()).filter(t => t);
            tagList.forEach(tag => {
              if (!stats.categoryStats[category].tags[tag]) {
                stats.categoryStats[category].tags[tag] = 0;
              }
              stats.categoryStats[category].tags[tag]++;
              
              // Global tag stats
              if (!stats.tagStats[tag]) {
                stats.tagStats[tag] = 0;
              }
              stats.tagStats[tag]++;
            });
          }
        });
      }
    });

    return stats;
  };

  const downloadStats = () => {
    if (!results) return;

    const stats = calculateStats();
    const csvContent = [
      'Statistic,Value,Percentage',
      `Total Videos,${stats.totalVideos},100%`,
      `Excluded Videos,${stats.excludedVideos},${((stats.excludedVideos / stats.totalVideos) * 100).toFixed(1)}%`,
      `Submitted Videos,${stats.submittedVideos},${((stats.submittedVideos / stats.totalVideos) * 100).toFixed(1)}%`,
      `Saved Videos,${stats.savedVideos},${((stats.savedVideos / stats.totalVideos) * 100).toFixed(1)}%`,
      '',
      'Category Statistics (excluding excluded videos)',
      'Category,Count,Percentage',
      ...Object.entries(stats.categoryStats).map(([category, data]) => 
        `${category},${data.count},${((data.count / (stats.totalVideos - stats.excludedVideos)) * 100).toFixed(1)}%`
      ),
      '',
      'Tag Statistics (excluding excluded videos)',
      'Tag,Count,Percentage',
      ...Object.entries(stats.tagStats).map(([tag, count]) => 
        `${tag},${count},${((count / (stats.totalVideos - stats.excludedVideos)) * 100).toFixed(1)}%`
      ),
      '',
      'Coder Statistics',
      'Coder,Total Videos,Submitted,Saved',
      ...Object.entries(stats.coderStats).map(([coder, data]) => 
        `${coder},${data.total},${data.submitted},${data.saved}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.slug}_statistics.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderBarChart = (data, maxValue, height = 200) => {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'end', gap: '8px', padding: '10px 0' }}>
        {Object.entries(data)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8) // Show top 8 items
          .map(([label, value]) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: '100%', 
                  height: `${(value / maxValue) * (height - 60)}px`,
                  backgroundColor: '#007bff',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px'
                }}
              />
              <div style={{ 
                fontSize: '0.7rem', 
                textAlign: 'center', 
                marginTop: '4px', 
                wordBreak: 'break-word',
                lineHeight: '1.2',
                height: '40px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center'
              }}>
                {label.length > 12 ? label.substring(0, 10) + '...' : label}
              </div>
            </div>
          ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">Loading results...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <div className="text-center text-danger">{error}</div>
        <Button variant="outline-secondary" onClick={() => navigate('/')} className="mt-3">
          <ArrowLeft className="me-2" />Back to Home
        </Button>
      </Container>
    );
  }

  const stats = calculateStats();
  if (!stats) return null;

      const validVideos = (stats.totalVideos * Object.keys(stats.coderStats).length) - stats.excludedVideos;

  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <Button variant="outline-secondary" onClick={() => navigate('/')}>
              <ArrowLeft className="me-2" />Back to Home
            </Button>
            <h2 className="mb-0">Results Analysis: {project?.name}</h2>
            <Button variant="success" onClick={downloadStats}>
              <Download className="me-2" />Download Statistics
            </Button>
          </div>
        </Col>
      </Row>

      {/* Overview Statistics and Coder Performance */}
      <Row className="mb-4">
        <Col md={6}>
          <Row>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-primary">{stats.totalVideos}</h3>
                  <Card.Title>Total Videos</Card.Title>
                  <small className="text-muted">
                    {Object.keys(stats.coderStats).length} coders
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-success">{stats.submittedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Submitted</Card.Title>
                  <small className="text-muted">
                    {((stats.submittedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-3">
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-warning">{stats.savedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Saved</Card.Title>
                  <small className="text-muted">
                    {((stats.savedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="text-center h-100">
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h3 className="text-danger">{stats.excludedVideos} / {stats.totalVideos * Object.keys(stats.coderStats).length}</h3>
                  <Card.Title>Excluded</Card.Title>
                  <small className="text-muted">
                    {((stats.excludedVideos / (stats.totalVideos * Object.keys(stats.coderStats).length)) * 100).toFixed(1)}% of total
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header>Coder Performance</Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th className="text-center">Coder</th>
                    <th className="text-center" width="15%">Total</th>
                    <th className="text-center" width="15%">Submitted</th>
                    <th className="text-center" width="15%">Saved</th>
                    <th className="text-center" width="20%">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.coderStats).map(([coder, data]) => (
                    <tr key={coder}>
                      <td><strong>{coder}</strong></td>
                      <td className="text-center">{data.total}</td>
                      <td className="text-center text-success">{data.submitted}</td>
                      <td className="text-center text-warning">{data.saved}</td>
                      <td className="text-center">
                        <span className="fw-semibold" style={{ color: data.submitted > 0 ? '#198754' : '#ffc107' }}>
                          {((data.submitted / stats.totalVideos) * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Detailed Category Breakdown */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <BarChart className="me-2" />
              Detailed Category Breakdown
            </Card.Header>
            <Card.Body>
              <Row>
                {Object.entries(stats.categoryStats)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .map(([category, data]) => (
                    <Col md={6} key={category} className="mb-4">
                      <div className="border rounded p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0 fw-bold">{category}</h5>
                          <div className="text-muted">
                            {data.count} / {validVideos} videos ({((data.count / validVideos) * 100).toFixed(1)}%)
                          </div>
                        </div>
                        
                        {/* Category Bar Chart */}
                        {Object.keys(data.tags).length > 0 && (
                          <div className="mb-3">
                            {renderBarChart(
                              data.tags,
                              Math.max(...Object.values(data.tags)),
                              120
                            )}
                          </div>
                        )}
                        
                        {/* Tags Table */}
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th className="text-center">Tag</th>
                              <th className="text-center" width="25%">Count</th>
                              <th className="text-center" width="25%">Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(data.tags)
                              .sort(([,a], [,b]) => b - a)
                              .map(([tag, count]) => (
                                <tr key={tag}>
                                  <td>
                                    <strong>{tag}</strong>
                                  </td>
                                  <td className="text-center">{count} / {data.count}</td>
                                  <td className="text-center">{((count / data.count) * 100).toFixed(1)}%</td>
                                </tr>
                              ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                  ))}
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Advanced Statistical Analysis */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <GraphUp className="me-2" />
              Advanced Statistical Analysis
            </Card.Header>
            <Card.Body>
              <Row>
                {/* Correlation Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <ArrowLeftRight className="me-2" />
                      Category-Tag Correlations
                    </Card.Header>
                    <Card.Body>
                      {renderCorrelationAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Co-occurrence Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <Link className="me-2" />
                      Tag Co-occurrence Matrix
                    </Card.Header>
                    <Card.Body>
                      {renderCooccurrenceAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Coder Agreement Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <People className="me-2" />
                      Inter-Coder Agreement
                    </Card.Header>
                    <Card.Body>
                      {renderCoderAgreementAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Distribution Analysis */}
                <Col md={6} className="mb-4">
                  <Card className="h-100">
                    <Card.Header>
                      <BarChart className="me-2" />
                      Distribution Statistics
                    </Card.Header>
                    <Card.Body>
                      {renderDistributionAnalysis(stats, results)}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
